import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const reports = [
  { href: "/reports/daily-sales", title: "Daily Sales Report", desc: "Sales invoices by day, VAT + N-VAT" },
  { href: "/reports/vat-sales", title: "VAT Sales Report", desc: "VAT-only invoices with VAT amounts" },
  { href: "/reports/nvat-damage", title: "N-VAT / Damage Report", desc: "Damage adjustments and their remarks" },
  { href: "/reports/purchases", title: "Purchase Report", desc: "Purchase stock transactions" },
  { href: "/reports/expenses", title: "Expense Report", desc: "Expense entries" },
  { href: "/reports/stock", title: "Stock Availability Report", desc: "Current stock on hand and value" },
  { href: "/reports/stock-movements", title: "Stock Movement Report", desc: "All stock movement transactions" },
  { href: "/reports/conversions", title: "Invoice Conversion Report", desc: "VAT -> N-VAT / Damage conversions" },
];

export default function ReportsIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Business, stock, and audit reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{r.title}</CardTitle>
                <CardDescription>{r.desc}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Open →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
