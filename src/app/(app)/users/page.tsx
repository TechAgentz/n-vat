import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireUser();
  assert(user, "USER_MANAGE");
  const rows = await prisma.user.findMany({ where: { companyId: user.companyId }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <Card>
        <CardHeader><CardTitle>Team members ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Can Convert</TableHead><TableHead>Active</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant={u.role === "ADMIN" ? "destructive" : u.role === "AUDITOR" ? "secondary" : "info"}>{u.role}</Badge></TableCell>
                  <TableCell>{u.canConvert ? "Yes" : "No"}</TableCell>
                  <TableCell>{u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
