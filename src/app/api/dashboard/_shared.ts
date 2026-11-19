import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/server/auth/context";

export type DashboardContext = {
  tenantId: string;
  userId: string;
};

export async function resolveDashboardContext(request: NextRequest): Promise<DashboardContext | null> {
  const auth = await getAuthContext(request);
  if (auth) {
    return {
      tenantId: auth.tenantId,
      userId: auth.userId,
    };
  }

  const [tenant, user] = await Promise.all([
    prisma.tenant.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!tenant || !user) {
    return null;
  }

  return {
    tenantId: tenant.id,
    userId: user.id,
  };
}

export function decimalToNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : value.toNumber();
}

export function parseDateOrNull(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDatePtBr(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export async function ensureNamedProductRelation(
  tenantId: string,
  model: "productCategory" | "brand" | "supplier",
  name: string | null | undefined,
) {
  const cleaned = name?.trim();
  if (!cleaned) {
    return null;
  }

  if (model === "productCategory") {
    const existing = await prisma.productCategory.findFirst({
      where: { tenantId, name: cleaned },
    });

    return existing ?? prisma.productCategory.create({
      data: {
        tenantId,
        name: cleaned,
      },
    });
  }

  if (model === "brand") {
    const existing = await prisma.brand.findFirst({
      where: { tenantId, name: cleaned },
    });

    return existing ?? prisma.brand.create({
      data: {
        tenantId,
        name: cleaned,
      },
    });
  }

  const existing = await prisma.supplier.findFirst({
    where: { tenantId, name: cleaned },
  });

  return existing ?? prisma.supplier.create({
    data: {
      tenantId,
      name: cleaned,
    },
  });
}
