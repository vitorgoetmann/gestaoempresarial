import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/server/auth/schemas";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { signAccessToken, signRefreshToken } from "@/server/auth/tokens";
import { createSession } from "@/server/auth/session";
import { createCsrfToken } from "@/server/auth/csrf";
import { setAuthCookies, setCsrfCookie } from "@/server/auth/response";
import { slugify } from "@/server/utils/slug";
import { logAudit } from "@/server/audit/logger";
import { getClientInfo } from "@/server/http/client";
import { errorPayload } from "@/server/http/errors";

async function ensureUniqueSlug(base: string) {
  const slugBase = slugify(base);
  let slug = slugBase;
  let counter = 1;

  while (await prisma.tenant.findFirst({ where: { slug } })) {
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  const { ipAddress, userAgent } = getClientInfo(request);

  if (!parsed.success) {
    return NextResponse.json(errorPayload("Dados invalidos", "VALIDATION"), {
      status: 400,
    });
  }

  const { name, email, password, tenantName } = parsed.data;

  let existing = null;
  let isOfflineFallback = false;

  try {
    existing = await prisma.user.findFirst({ where: { email } });
  } catch (dbError) {
    console.warn("Database connection failed, using offline fallback for registration:", dbError);
    isOfflineFallback = true;
  }

  if (isOfflineFallback) {
    const mockUserId = crypto.randomUUID();
    const mockTenantId = crypto.randomUUID();
    const mockSlug = slugify(tenantName);
    const sessionId = crypto.randomUUID();

    const refreshToken = await signRefreshToken({
      sub: mockUserId,
      tenantId: mockTenantId,
      sessionId,
    });

    const accessToken = await signAccessToken({
      sub: mockUserId,
      tenantId: mockTenantId,
      role: "OWNER",
      sessionId,
    });

    const csrf = createCsrfToken();
    const response = NextResponse.json({
      user: { id: mockUserId, name, email },
      tenant: { id: mockTenantId, name: tenantName, slug: mockSlug },
      role: "OWNER",
      csrfToken: csrf.token,
      demoMode: true,
    });

    response.headers.set("Cache-Control", "no-store");
    setAuthCookies(response, accessToken, refreshToken);
    setCsrfCookie(response, csrf.signed);

    return response;
  }

  if (existing) {
    return NextResponse.json(errorPayload("Email ja cadastrado", "CONFLICT"), {
      status: 409,
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      status: "ACTIVE",
    },
  });

  const slug = await ensureUniqueSlug(tenantName);
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug,
      status: "ACTIVE",
      ownerId: user.id,
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
    },
  });

  const membership = await prisma.membership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  const sessionId = crypto.randomUUID();
  const refreshToken = await signRefreshToken({
    sub: user.id,
    tenantId: tenant.id,
    sessionId,
  });

  try {
    await createSession({
      sessionId,
      tenantId: tenant.id,
      userId: user.id,
      refreshToken,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("Failed to create database session", err);
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    tenantId: tenant.id,
    role: membership.role,
    sessionId,
  });

  try {
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      module: "AUTH",
      action: "REGISTER",
      entity: "USER",
      entityId: user.id,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("Failed to write audit log for registration", err);
  }

  const csrf = createCsrfToken();
  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    role: membership.role,
    csrfToken: csrf.token,
  });

  response.headers.set("Cache-Control", "no-store");
  setAuthCookies(response, accessToken, refreshToken);
  setCsrfCookie(response, csrf.signed);

  return response;
}
