import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export async function logAccess(params: {
  tenantId?: string | null;
  userId?: string | null;
  action: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "PASSWORD_RESET";
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.accessLog.create({
    data: {
      tenantId: params.tenantId ?? undefined,
      userId: params.userId ?? undefined,
      action: params.action,
      success: params.success,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}
