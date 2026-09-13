import { getInvoice } from "@/server/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await getInvoice(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{inv.invoiceNumber}</h1>
        <Badge variant={inv.type === "VAT" ? "default" : "warning"}>{inv.type === "N_VAT" ? "N-VAT" : inv.type}</Badge>
        <Badge variant={inv.status === "ISSUED" ? "info" : inv.status === "CONVERTED" ? "warning" : "secondary"}>{inv.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader><CardContent>{inv.customer.name}<div className="text-xs text-muted-foreground">{inv.customer.code}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Date</CardTitle></CardHeader><CardContent>{formatDate(inv.invoiceDate)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Created by</CardTitle></CardHeader><CardContent>{inv.createdBy.name}<div className="text-xs text-muted-foreground">{formatDateTime(inv.createdAt)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>SKU</TableHead><TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">VAT %</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {inv.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono">{it.product.sku}</TableCell>
                  <TableCell>{it.product.name}</TableCell>
                  <TableCell className="text-right">{String(it.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(it.unitPrice))}</TableCell>
                  <TableCell className="text-right">{String(it.vatRate)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(it.vatAmount))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(it.lineTotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 flex justify-end gap-6 text-sm">
            <div>Subtotal: <b>{formatCurrency(Number(inv.subtotal))}</b></div>
            <div>VAT: <b>{formatCurrency(Number(inv.vatAmount))}</b></div>
            <div>Total: <b>{formatCurrency(Number(inv.totalAmount))}</b></div>
          </div>
        </CardContent>
      </Card>

      {inv.conversions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Conversion history</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>When</TableHead><TableHead>By</TableHead><TableHead>Type</TableHead><TableHead>New status</TableHead><TableHead>Remark</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {inv.conversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatDateTime(c.convertedAt)}</TableCell>
                    <TableCell>{c.convertedBy.name}</TableCell>
                    <TableCell>{c.conversionType}</TableCell>
                    <TableCell>{c.newStatus}</TableCell>
                    <TableCell>{c.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
