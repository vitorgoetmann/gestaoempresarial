import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export async function logAudit(params: {
  tenantId: string;
  userId?: string | null;
  module: string;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId ?? undefined,
      module: params.module,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? undefined,
      before: params.before ? (params.before as Prisma.InputJsonValue) : undefined,
      after: params.after ? (params.after as Prisma.InputJsonValue) : undefined,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
    },
  });
}
