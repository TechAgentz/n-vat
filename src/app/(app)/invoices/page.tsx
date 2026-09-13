import { listInvoices } from "@/server/invoices";
import { InvoiceListClient } from "./invoice-list-client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(sp)) raw[k] = Array.isArray(v) ? v[0] : v;

  const [{ items, total, page, pageSize, filters }, user] = await Promise.all([
    listInvoices(raw),
    requireUser(),
  ]);

  return (
    <InvoiceListClient
      initialItems={items.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        invoiceDate: i.invoiceDate.toISOString(),
        customer: i.customer.name,
        totalAmount: Number(i.totalAmount),
        vatAmount: Number(i.vatAmount),
        status: i.status,
        type: i.type,
        createdBy: i.createdBy.name,
        updatedAt: i.updatedAt.toISOString(),
      }))}
      total={total}
      page={page}
      pageSize={pageSize}
      filters={filters}
      canConvert={can(user, "INVOICE_CONVERT")}
    />
  );
}
