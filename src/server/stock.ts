"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assert } from "@/lib/rbac";

export async function listStock(q?: string) {
  const user = await requireUser();
  assert(user, "STOCK_VIEW");
  return prisma.product.findMany({
    where: {
      companyId: user.companyId,
      isActive: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function listStockMovements(productId?: string, take = 100) {
  const user = await requireUser();
  assert(user, "STOCK_VIEW");
  return prisma.stockTransaction.findMany({
    where: {
      product: { companyId: user.companyId },
      ...(productId ? { productId } : {}),
    },
    include: {
      product: { select: { sku: true, name: true } },
      user: { select: { name: true } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
