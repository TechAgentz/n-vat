import { dashboardMetrics } from "@/server/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await dashboardMetrics();

  const tiles = [
    { label: "Today's VAT Sales", value: formatCurrency(m.todayVatTotal), sub: `${m.todayVatCount} invoices` },
    { label: "Today's N-VAT / Damage", value: String(m.todayNvatCount), sub: "conversions" },
    { label: "Total Sales", value: formatCurrency(m.totalSales), sub: "all time" },
    { label: "Stock Value", value: formatCurrency(m.stockValue), sub: `${m.lowStock.length} low stock` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Convert VAT invoices to N-VAT / Damage with <span className="font-mono">Ctrl + Alt + Shift + N</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2"><CardDescription>{t.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t.value}</div>
              <div className="text-xs text-muted-foreground">{t.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {m.recentInvoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell><Link className="underline" href={`/invoices/${i.id}`}>{i.invoiceNumber}</Link></TableCell>
                    <TableCell>{i.customer.name}</TableCell>
                    <TableCell>{formatCurrency(Number(i.totalAmount))}</TableCell>
                    <TableCell><Badge variant={i.status === "CONVERTED" ? "warning" : "info"}>{i.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Conversions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>By</TableHead><TableHead>When</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
              <TableBody>
                {m.recentConversions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.originalInvoiceNumber}</TableCell>
                    <TableCell>{c.convertedBy.name}</TableCell>
                    <TableCell>{formatDateTime(c.convertedAt)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={c.remark}>{c.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {m.lowStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Low Stock</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Name</TableHead><TableHead>On hand</TableHead><TableHead>Threshold</TableHead></TableRow></TableHeader>
              <TableBody>
                {m.lowStock.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{String(p.stockQty)}</TableCell>
                    <TableCell>{String(p.lowStock)}</TableCell>
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
