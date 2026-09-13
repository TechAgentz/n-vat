import { PrismaClient, Role, InvoiceType, InvoiceStatus, StockTxnType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "seed-company" },
    update: {},
    create: {
      id: "seed-company",
      name: "N-VAT Demo Co.",
      vatNumber: "VAT-000-001",
      address: "1 Demo Street",
      phone: "+000-000-000",
    },
  });

  const users = [
    { email: "admin@nvat.local", name: "Admin User", role: Role.ADMIN, canConvert: true, password: "Admin@12345" },
    { email: "manager@nvat.local", name: "Manager User", role: Role.MANAGER, canConvert: true, password: "Manager@12345" },
    { email: "user@nvat.local", name: "Sales User", role: Role.USER, canConvert: true, password: "User@12345" },
    { email: "auditor@nvat.local", name: "Auditor User", role: Role.AUDITOR, canConvert: false, password: "Auditor@12345" },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const rec = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, canConvert: u.canConvert, isActive: true, companyId: company.id },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        canConvert: u.canConvert,
        passwordHash: hash,
        companyId: company.id,
      },
    });
    created[u.email] = rec.id;
  }
  const adminId = created["admin@nvat.local"];

  const customers = [
    { code: "C001", name: "Acme Traders", vatNumber: "VAT-111" },
    { code: "C002", name: "Beta Wholesale", vatNumber: "VAT-222" },
    { code: "C003", name: "Gamma Retail", vatNumber: "VAT-333" },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { companyId_code: { companyId: company.id, code: c.code } },
      update: {},
      create: { ...c, companyId: company.id },
    });
  }

  const products = [
    { sku: "P-A", name: "Product A", unitPrice: "100.00", vatRate: "15.00", stockQty: "500", lowStock: "50" },
    { sku: "P-B", name: "Product B", unitPrice: "250.00", vatRate: "15.00", stockQty: "200", lowStock: "20" },
    { sku: "P-C", name: "Product C", unitPrice: "75.50",  vatRate: "15.00", stockQty: "50",  lowStock: "60" },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: p.sku } },
      update: {},
      create: { ...p, companyId: company.id } as any,
    });
  }

  // Create a couple demo VAT invoices with stock transactions
  const cust = await prisma.customer.findFirst({ where: { companyId: company.id } });
  const prodA = await prisma.product.findFirst({ where: { companyId: company.id, sku: "P-A" } });
  const prodB = await prisma.product.findFirst({ where: { companyId: company.id, sku: "P-B" } });
  if (!cust || !prodA || !prodB) throw new Error("Seed failed: missing entities");

  const existing = await prisma.invoice.count({ where: { companyId: company.id } });
  if (existing === 0) {
    for (let i = 1; i <= 3; i++) {
      const qtyA = 10;
      const qtyB = 4;
      const subA = Number(prodA.unitPrice) * qtyA;
      const subB = Number(prodB.unitPrice) * qtyB;
      const vatA = subA * (Number(prodA.vatRate) / 100);
      const vatB = subB * (Number(prodB.vatRate) / 100);
      const subtotal = subA + subB;
      const vat = vatA + vatB;
      const total = subtotal + vat;

      await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoiceNumber: `INV-1002${i}`,
            invoiceDate: new Date(),
            customerId: cust.id,
            companyId: company.id,
            type: InvoiceType.VAT,
            status: InvoiceStatus.ISSUED,
            subtotal: subtotal.toFixed(2),
            vatAmount: vat.toFixed(2),
            totalAmount: total.toFixed(2),
            createdById: adminId,
            items: {
              create: [
                {
                  productId: prodA.id, quantity: qtyA, unitPrice: prodA.unitPrice,
                  vatRate: prodA.vatRate, vatAmount: vatA.toFixed(2), lineTotal: (subA + vatA).toFixed(2),
                },
                {
                  productId: prodB.id, quantity: qtyB, unitPrice: prodB.unitPrice,
                  vatRate: prodB.vatRate, vatAmount: vatB.toFixed(2), lineTotal: (subB + vatB).toFixed(2),
                },
              ],
            },
          },
        });

        for (const [pid, qty] of [[prodA.id, qtyA], [prodB.id, qtyB]] as const) {
          const p = await tx.product.update({
            where: { id: pid as string },
            data: { stockQty: { decrement: qty as number } },
          });
          await tx.stockTransaction.create({
            data: {
              productId: pid as string,
              type: StockTxnType.SALE,
              quantity: -(qty as number),
              balanceAfter: p.stockQty,
              invoiceId: inv.id,
              userId: adminId,
              reference: inv.invoiceNumber,
            },
          });
        }
      });
    }
  }

  console.log("Seed complete. Login as admin@nvat.local / Admin@12345");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
