import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function writeAudit(
  tx: Prisma.TransactionClient | typeof prisma,
  input: {
    actorId?: string | null;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }
) {
  return (tx as any).auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: (input.metadata as any) ?? undefined,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
