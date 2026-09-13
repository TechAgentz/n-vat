import { dailySalesReport } from "@/server/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DailySalesReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const rows = await dailySalesReport(from, to);
  const total = rows.reduce((a, r) => a + Number(r.totalAmount), 0);
  const vat = rows.reduce((a, r) => a + Number(r.vatAmount), 0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Daily Sales Report</h1>
      <form className="flex gap-2 items-end">
        <div><label className="block text-xs">From</label><input name="from" type="date" defaultValue={from} className="border rounded px-2 h-9" /></div>
        <div><label className="block text-xs">To</label><input name="to" type="date" defaultValue={to} className="border rounded px-2 h-9" /></div>
        <button className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm">Apply</button>
      </form>
      <Card>
        <CardHeader><CardTitle>{rows.length} invoices — Total {formatCurrency(total)} · VAT {formatCurrency(vat)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">VAT</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.invoiceDate)}</TableCell>
                  <TableCell className="font-mono">{r.invoiceNumber}</TableCell>
                  <TableCell>{r.customer.name}</TableCell>
                  <TableCell>{r.type === "N_VAT" ? "N-VAT" : r.type}</TableCell>
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
