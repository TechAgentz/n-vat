import { listStock } from "@/server/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockAvailabilityReport() {
  const products = await listStock();
  const totalValue = products.reduce((a, p) => a + Number(p.unitPrice) * Number(p.stockQty), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Stock Availability Report</h1>
      <Card>
        <CardHeader><CardTitle>{products.length} products — Total value {formatCurrency(totalValue)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>SKU</TableHead><TableHead>Name</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Low threshold</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.sku}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{String(p.stockQty)}</TableCell>
                  <TableCell className="text-right">{String(p.lowStock)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(p.unitPrice))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(p.unitPrice) * Number(p.stockQty))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
