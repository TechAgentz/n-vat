import type { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";

export const Permissions = {
  INVOICE_VIEW: ["ADMIN", "MANAGER", "USER", "AUDITOR"],
  INVOICE_CREATE: ["ADMIN", "MANAGER", "USER"],
  INVOICE_CONVERT: ["ADMIN", "MANAGER", "USER"], // USER also needs canConvert flag
  STOCK_VIEW: ["ADMIN", "MANAGER", "USER", "AUDITOR"],
  REPORT_VIEW: ["ADMIN", "MANAGER", "AUDITOR"],
  AUDIT_VIEW: ["ADMIN", "AUDITOR"],
  USER_MANAGE: ["ADMIN"],
  SETTINGS_MANAGE: ["ADMIN"],
} as const;

export type Permission = keyof typeof Permissions;

export function hasRole(user: SessionUser, roles: readonly Role[]): boolean {
  return roles.includes(user.role);
}

export function can(user: SessionUser, permission: Permission): boolean {
  const roles = Permissions[permission] as unknown as Role[];
  const roleOk = roles.includes(user.role);
  if (!roleOk) return false;
  if (permission === "INVOICE_CONVERT" && user.role === "USER" && !user.canConvert) return false;
  return true;
}

export function assert(user: SessionUser, permission: Permission) {
  if (!can(user, permission)) throw new Error("FORBIDDEN");
}
