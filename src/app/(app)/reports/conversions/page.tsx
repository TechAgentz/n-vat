import { conversionReport } from "@/server/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConversionReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const rows = await conversionReport(from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Conversion Report</h1>
        <p className="text-sm text-muted-foreground">VAT → N-VAT / Damage conversions and their audit trail.</p>
      </div>

      <form className="flex gap-2 items-end">
        <div>
          <label className="block text-xs">From</label>
          <input name="from" type="date" defaultValue={from} className="border rounded px-2 h-9" />
        </div>
        <div>
          <label className="block text-xs">To</label>
          <input name="to" type="date" defaultValue={to} className="border rounded px-2 h-9" />
        </div>
        <button className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm">Apply</button>
      </form>

      <Card>
        <CardHeader><CardTitle>Results ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Original invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Original VAT</TableHead>
              <TableHead>Converted at</TableHead>
              <TableHead>Converted by</TableHead>
              <TableHead>Products / Qty</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => {
                const items = Array.isArray(r.affectedItems) ? (r.affectedItems as any[]) : [];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.originalInvoiceNumber}</TableCell>
                    <TableCell>{r.invoice.customer.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.originalVatAmount))}</TableCell>
                    <TableCell>{formatDateTime(r.convertedAt)}</TableCell>
                    <TableCell>{r.convertedBy.name}</TableCell>
                    <TableCell className="text-xs">
                      {items.map((it) => `${it.productSku}×${it.damagedQuantity}`).join(", ")}
                    </TableCell>
                    <TableCell className="max-w-sm">{r.remark}</TableCell>
                    <TableCell>{r.newStatus}</TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No conversions in this range.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
