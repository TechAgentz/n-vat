import { listStock, listStockMovements } from "@/server/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [stock, moves] = await Promise.all([listStock(), listStockMovements()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Stock</h1>

      <Card>
        <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>SKU</TableHead><TableHead>Product</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stock.map((p) => {
                const low = Number(p.stockQty) <= Number(p.lowStock);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{String(p.stockQty)}</TableCell>
                    <TableCell className="text-right">{String(p.lowStock)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.unitPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.unitPrice) * Number(p.stockQty))}</TableCell>
                    <TableCell>{low ? <Badge variant="destructive">LOW</Badge> : <Badge variant="success">OK</Badge>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent movements</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Product</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Ref</TableHead><TableHead>User</TableHead><TableHead>Note</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {moves.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                  <TableCell>{m.product.sku} <span className="text-muted-foreground">{m.product.name}</span></TableCell>
                  <TableCell><Badge variant={m.type === "DAMAGE" || m.type === "N_VAT_ADJUSTMENT" ? "warning" : "info"}>{m.type}</Badge></TableCell>
                  <TableCell className="text-right">{String(m.quantity)}</TableCell>
                  <TableCell className="text-right">{String(m.balanceAfter)}</TableCell>
                  <TableCell>{m.invoice?.invoiceNumber ?? m.reference ?? ""}</TableCell>
                  <TableCell>{m.user.name}</TableCell>
                  <TableCell className="text-xs max-w-md truncate" title={m.note ?? ""}>{m.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
