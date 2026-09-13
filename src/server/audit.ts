"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";

export async function listAuditLogs(take = 200) {
  const user = await requireUser();
  assert(user, "AUDIT_VIEW");
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { name: true, email: true } } },
  });
}
