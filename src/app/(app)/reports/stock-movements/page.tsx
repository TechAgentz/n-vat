import { listStockMovements } from "@/server/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockMovementReport() {
  const rows = await listStockMovements(undefined, 500);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Stock Movement Report</h1>
      <Card>
        <CardHeader><CardTitle>{rows.length} movements</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Product</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Note</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                  <TableCell>{m.product.sku} — {m.product.name}</TableCell>
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
