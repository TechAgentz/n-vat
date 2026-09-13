import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VatSalesReport() {
  const u = await requireUser();
  assert(u, "REPORT_VIEW");
  const rows = await prisma.invoice.findMany({
    where: { companyId: u.companyId, type: "VAT" },
    orderBy: { invoiceDate: "desc" },
    include: { customer: { select: { name: true } } },
    take: 500,
  });
  const total = rows.reduce((a, r) => a + Number(r.totalAmount), 0);
  const vat = rows.reduce((a, r) => a + Number(r.vatAmount), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">VAT Sales Report</h1>
      <Card>
        <CardHeader><CardTitle>{rows.length} VAT invoices — Total {formatCurrency(total)} · VAT {formatCurrency(vat)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">VAT</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.invoiceDate)}</TableCell>
                  <TableCell className="font-mono">{r.invoiceNumber}</TableCell>
                  <TableCell>{r.customer.name}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.subtotal))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.vatAmount))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(r.totalAmount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
