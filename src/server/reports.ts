"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";
import { InvoiceStatus, InvoiceType } from "@prisma/client";

function dayRange(day: Date) {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

export async function dashboardMetrics() {
  const user = await requireUser();
  assert(user, "INVOICE_VIEW");
  const companyId = user.companyId;
  const today = dayRange(new Date());

  const [
    todayVat, todayNvat, totalSales, purchaseCount, stockValueAgg, lowStock, recentInvoices, recentConversions,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { companyId, type: InvoiceType.VAT, invoiceDate: today },
      _sum: { totalAmount: true }, _count: true,
    }),
    prisma.invoiceConversion.count({ where: { invoice: { companyId }, convertedAt: today } }),
    prisma.invoice.aggregate({
      where: { companyId, type: InvoiceType.VAT },
      _sum: { totalAmount: true },
    }),
    prisma.stockTransaction.count({ where: { product: { companyId }, type: "PURCHASE" } }),
    prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { unitPrice: true, stockQty: true, lowStock: true, id: true, name: true, sku: true },
    }),
    prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, sku: true, stockQty: true, lowStock: true },
    }),
    prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: { select: { name: true } } },
    }),
    prisma.invoiceConversion.findMany({
      where: { invoice: { companyId } },
      orderBy: { convertedAt: "desc" },
      take: 8,
      include: { convertedBy: { select: { name: true } } },
    }),
  ]);

  const stockValue = stockValueAgg.reduce((acc, p) => acc + Number(p.unitPrice) * Number(p.stockQty), 0);
  const low = lowStock.filter((p) => Number(p.stockQty) <= Number(p.lowStock));

  return {
    todayVatTotal: Number(todayVat._sum.totalAmount ?? 0),
    todayVatCount: todayVat._count,
    todayNvatCount: todayNvat,
    totalSales: Number(totalSales._sum.totalAmount ?? 0),
    purchaseCount,
    stockValue,
    lowStock: low,
    recentInvoices,
    recentConversions,
  };
}

export async function conversionReport(from?: string, to?: string) {
  const user = await requireUser();
  assert(user, "REPORT_VIEW");
  const where: any = { invoice: { companyId: user.companyId } };
  if (from || to) {
    where.convertedAt = {};
    if (from) where.convertedAt.gte = new Date(from);
    if (to) where.convertedAt.lte = new Date(to);
  }
  return prisma.invoiceConversion.findMany({
    where,
    orderBy: { convertedAt: "desc" },
    include: {
      convertedBy: { select: { name: true } },
      invoice: { include: { customer: { select: { name: true } } } },
    },
  });
}

export async function dailySalesReport(from?: string, to?: string) {
  const user = await requireUser();
  assert(user, "REPORT_VIEW");
  const where: any = { companyId: user.companyId, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.CONVERTED] } };
  if (from || to) {
    where.invoiceDate = {};
    if (from) where.invoiceDate.gte = new Date(from);
    if (to) where.invoiceDate.lte = new Date(to);
  }
  return prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    include: { customer: { select: { name: true } } },
  });
}
