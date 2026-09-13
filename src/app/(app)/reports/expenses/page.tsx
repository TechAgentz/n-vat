import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ExpenseReport() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Expense Report</h1>
      <Card>
        <CardHeader>
          <CardTitle>Not implemented in this build</CardTitle>
          <CardDescription>
            Expense tracking is out of scope for the initial N-VAT / Damage conversion delivery. Add an <code>Expense</code> model and CRUD server actions when the finance module is prioritized.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The database schema, RBAC, and audit infrastructure already support adding this without changes to the conversion flow.
        </CardContent>
      </Card>
    </div>
  );
}
