import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchaseReport() {
  const u = await requireUser();
  assert(u, "REPORT_VIEW");
  const rows = await prisma.stockTransaction.findMany({
    where: { type: "PURCHASE", product: { companyId: u.companyId } },
    orderBy: { createdAt: "desc" },
    include: { product: true, user: { select: { name: true } } },
    take: 500,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
      <Card>
        <CardHeader><CardTitle>{rows.length} purchase entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Reference</TableHead><TableHead>Recorded by</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No purchases recorded.</TableCell></TableRow>
              ) : rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                  <TableCell>{m.product.sku} — {m.product.name}</TableCell>
                  <TableCell className="text-right">{String(m.quantity)}</TableCell>
                  <TableCell>{m.reference ?? ""}</TableCell>
                  <TableCell>{m.user.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
