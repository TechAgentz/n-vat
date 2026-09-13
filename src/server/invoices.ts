"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";
import { convertInvoicesSchema, createInvoiceSchema, invoiceFiltersSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { InvoiceStatus, InvoiceType, Prisma, StockTxnType, ConversionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function listInvoices(rawFilters: Record<string, unknown>) {
  const user = await requireUser();
  assert(user, "INVOICE_VIEW");
  const f = invoiceFiltersSchema.parse(rawFilters);

  const where: Prisma.InvoiceWhereInput = { companyId: user.companyId };
  if (f.q) where.invoiceNumber = { contains: f.q, mode: "insensitive" };
  if (f.customer) where.customer = { name: { contains: f.customer, mode: "insensitive" } };
  if (f.status !== "ALL") where.status = f.status as InvoiceStatus;
  if (f.type !== "ALL") where.type = f.type as InvoiceType;
  if (f.from || f.to) {
    where.invoiceDate = {};
    if (f.from) (where.invoiceDate as any).gte = new Date(f.from);
    if (f.to) (where.invoiceDate as any).lte = new Date(f.to);
  }

  const orderBy: Prisma.InvoiceOrderByWithRelationInput =
    f.sort === "date_desc" ? { invoiceDate: "desc" } :
    f.sort === "date_asc" ? { invoiceDate: "asc" } :
    f.sort === "number_asc" ? { invoiceNumber: "asc" } :
    { invoiceNumber: "desc" };

  const [total, items] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { total, items, page: f.page, pageSize: f.pageSize, filters: f };
}

export async function getInvoice(id: string) {
  const user = await requireUser();
  assert(user, "INVOICE_VIEW");
  const inv = await prisma.invoice.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      items: { include: { product: true } },
      conversions: { include: { convertedBy: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!inv) throw new Error("NOT_FOUND");
  return inv;
}

export async function createInvoice(input: unknown) {
  const user = await requireUser();
  assert(user, "INVOICE_CREATE");
  const data = createInvoiceSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    // Recompute totals server-side; do not trust client.
    let subtotal = 0;
    let vatAmount = 0;
    const lines: Array<{ productId: string; quantity: number; unitPrice: number; vatRate: number; vatAmount: number; lineTotal: number }> = [];
    for (const it of data.items) {
      const gross = it.quantity * it.unitPrice;
      const vat = gross * (it.vatRate / 100);
      subtotal += gross;
      vatAmount += vat;
      lines.push({ ...it, vatAmount: vat, lineTotal: gross + vat });

      const product = await tx.product.findFirst({
        where: { id: it.productId, companyId: user.companyId },
      });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (Number(product.stockQty) < it.quantity) throw new Error(`INSUFFICIENT_STOCK:${product.sku}`);
    }
    const total = subtotal + vatAmount;

    const invoiceNumber = await nextInvoiceNumber(tx, user.companyId);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        customerId: data.customerId,
        companyId: user.companyId,
        type: InvoiceType.VAT,
        status: InvoiceStatus.ISSUED,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: total.toFixed(2),
        notes: data.notes,
        createdById: user.id,
        modifiedById: user.id,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice.toFixed(2),
            vatRate: l.vatRate.toFixed(2),
            vatAmount: l.vatAmount.toFixed(2),
            lineTotal: l.lineTotal.toFixed(2),
          })),
        },
      },
    });

    for (const l of lines) {
      const p = await tx.product.update({
        where: { id: l.productId },
        data: { stockQty: { decrement: l.quantity } },
      });
      if (Number(p.stockQty) < 0) throw new Error("STOCK_NEGATIVE");
      await tx.stockTransaction.create({
        data: {
          productId: l.productId,
          type: StockTxnType.SALE,
          quantity: -l.quantity,
          balanceAfter: p.stockQty,
          invoiceId: invoice.id,
          userId: user.id,
          reference: invoice.invoiceNumber,
        },
      });
    }

    await writeAudit(tx, {
      actorId: user.id,
      action: "INVOICE_CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, total },
    });

    return invoice;
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { ok: true as const, invoiceId: result.id };
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient, companyId: string) {
  const last = await tx.invoice.findFirst({
    where: { companyId, invoiceNumber: { startsWith: "INV-" } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const n = last ? Number(last.invoiceNumber.split("-")[1]) + 1 : 10001;
  return `INV-${n}`;
}

/**
 * Convert one or more VAT invoices to N-VAT/Damage.
 * Atomic per-invoice with optimistic locking (Invoice.version).
 * Never deletes the original. Emits StockTransaction of type DAMAGE / N_VAT_ADJUSTMENT.
 */
export async function convertInvoicesToNvat(input: unknown) {
  const user = await requireUser();
  assert(user, "INVOICE_CONVERT");
  const data = convertInvoicesSchema.parse(input);

  const results: Array<{ invoiceId: string; conversionId: string }> = [];
  const failures: Array<{ invoiceId: string; reason: string }> = [];

  for (const invoiceId of data.invoiceIds) {
    try {
      const conv = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: { id: invoiceId, companyId: user.companyId },
          include: { items: { include: { product: true } } },
        });
        if (!invoice) throw new Error("NOT_FOUND");
        if (invoice.type !== InvoiceType.VAT) throw new Error("NOT_VAT");
        if (invoice.status !== InvoiceStatus.ISSUED) throw new Error("NOT_ELIGIBLE");

        // Optimistic lock: bump version; if it changed under us, updateMany count = 0.
        const locked = await tx.invoice.updateMany({
          where: { id: invoice.id, version: invoice.version, status: InvoiceStatus.ISSUED },
          data: {
            status: InvoiceStatus.CONVERTED,
            modifiedById: user.id,
            version: { increment: 1 },
          },
        });
        if (locked.count === 0) throw new Error("CONCURRENT_MODIFICATION");

        const affectedItems = invoice.items.map((it) => {
          const requested = data.itemQuantities?.[it.id];
          const qty = requested !== undefined ? Math.min(Number(requested), Number(it.quantity)) : Number(it.quantity);
          return {
            invoiceItemId: it.id,
            productId: it.productId,
            productSku: it.product.sku,
            productName: it.product.name,
            originalQuantity: Number(it.quantity),
            damagedQuantity: qty,
            unitPrice: Number(it.unitPrice),
            vatRate: Number(it.vatRate),
            vatAmount: Number(it.vatAmount),
            lineTotal: Number(it.lineTotal),
          };
        });

        const conversion = await tx.invoiceConversion.create({
          data: {
            invoiceId: invoice.id,
            originalInvoiceNumber: invoice.invoiceNumber,
            originalInvoiceDate: invoice.invoiceDate,
            originalType: invoice.type,
            originalStatus: InvoiceStatus.ISSUED,
            newStatus: InvoiceStatus.CONVERTED,
            conversionType: data.conversionType as ConversionType,
            remark: data.remark,
            originalVatAmount: invoice.vatAmount,
            originalTotalAmount: invoice.totalAmount,
            affectedItems: affectedItems as any,
            convertedById: user.id,
          },
        });

        // Stock movements: damage does not return stock (already left the shelf).
        // We record a DAMAGE txn with quantity 0 change on hand BUT a positive damage counter is captured via note.
        // If business demands stock re-entry (return-to-warehouse for damage), switch to +qty.
        for (const line of affectedItems) {
          const damaged = line.damagedQuantity;
          if (damaged <= 0) continue;
          const balance = await tx.product.findUniqueOrThrow({ where: { id: line.productId } });
          await tx.stockTransaction.create({
            data: {
              productId: line.productId,
              type: data.conversionType === "DAMAGE" ? StockTxnType.DAMAGE : StockTxnType.N_VAT_ADJUSTMENT,
              quantity: 0, // stock was already decremented at SALE time; damage is bookkeeping
              balanceAfter: balance.stockQty,
              invoiceId: invoice.id,
              conversionId: conversion.id,
              userId: user.id,
              reference: invoice.invoiceNumber,
              note: `Damaged ${damaged} of ${line.productSku}. Remark: ${data.remark}`,
            },
          });
        }

        await writeAudit(tx, {
          actorId: user.id,
          action: "INVOICE_CONVERT",
          entity: "Invoice",
          entityId: invoice.id,
          metadata: {
            conversionId: conversion.id,
            invoiceNumber: invoice.invoiceNumber,
            conversionType: data.conversionType,
            remark: data.remark,
            affectedItems,
          },
        });

        return conversion;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      results.push({ invoiceId, conversionId: conv.id });
    } catch (e: any) {
      const reason = translateError(e?.message ?? "UNKNOWN");
      failures.push({ invoiceId, reason });
    }
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/reports/conversions");
  return { converted: results, failed: failures };
}

function translateError(code: string) {
  switch (code) {
    case "NOT_FOUND": return "Invoice not found.";
    case "NOT_VAT": return "Only VAT invoices can be converted.";
    case "NOT_ELIGIBLE": return "This invoice has already been converted.";
    case "CONCURRENT_MODIFICATION": return "Another user has already modified this invoice.";
    default:
      if (code.startsWith("INSUFFICIENT_STOCK")) return `Insufficient stock: ${code.split(":")[1]}`;
      return "Conversion failed. No changes were made.";
  }
}
