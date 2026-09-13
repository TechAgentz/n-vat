import { conversionReport } from "@/server/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NvatDamageReport() {
  const rows = await conversionReport();
  const totalVat = rows.reduce((a, r) => a + Number(r.originalVatAmount), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">N-VAT / Damage Report</h1>
      <Card>
        <CardHeader><CardTitle>{rows.length} adjustments — Original VAT {formatCurrency(totalVat)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Invoice</TableHead><TableHead>Type</TableHead><TableHead>By</TableHead><TableHead>Remark</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateTime(r.convertedAt)}</TableCell>
                  <TableCell className="font-mono">{r.originalInvoiceNumber}</TableCell>
                  <TableCell>{r.conversionType}</TableCell>
                  <TableCell>{r.convertedBy.name}</TableCell>
                  <TableCell>{r.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
