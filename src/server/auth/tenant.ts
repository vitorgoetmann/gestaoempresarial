import { prisma } from "../db/prisma";

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: { slug, deletedAt: null },
  });
}

export async function getMembership(tenantId: string, userId: string) {
  return prisma.membership.findFirst({
    where: {
      tenantId,
      userId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}
