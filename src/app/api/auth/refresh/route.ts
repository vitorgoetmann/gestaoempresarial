import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/server/auth/tokens";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/server/auth/cookies";
import { hashToken, getSessionExpiry, rotateSession } from "@/server/auth/session";
import { enforceCsrf } from "@/server/auth/csrf-guard";
import { createCsrfToken } from "@/server/auth/csrf";
import { setAuthCookies, setCsrfCookie } from "@/server/auth/response";
import { errorPayload } from "@/server/http/errors";

export async function POST(request: NextRequest) {
  if (!enforceCsrf(request)) {
    return NextResponse.json(errorPayload("CSRF invalido", "FORBIDDEN"), {
      status: 403,
    });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(errorPayload("Sessao expirada", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const verified = await verifyRefreshToken(refreshToken).catch(() => null);
  if (!verified) {
    return NextResponse.json(errorPayload("Token invalido", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const { payload } = verified;
  if (payload.type !== "refresh") {
    return NextResponse.json(errorPayload("Token invalido", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const session = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.sub,
      tenantId: payload.tenantId,
      revokedAt: null,
      deletedAt: null,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json(errorPayload("Sessao expirada", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    return NextResponse.json(errorPayload("Sessao invalida", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const membership = await prisma.membership.findFirst({
    where: {
      tenantId: payload.tenantId,
      userId: payload.sub,
      status: "ACTIVE",
      deletedAt: null,
    },
  });

  if (!membership) {
    return NextResponse.json(errorPayload("Acesso negado", "FORBIDDEN"), {
      status: 403,
    });
  }

  const newRefreshToken = await signRefreshToken({
    sub: payload.sub,
    tenantId: payload.tenantId,
    sessionId: payload.sessionId,
  });

  const newExpiresAt = getSessionExpiry(30);
  await rotateSession({
    sessionId: payload.sessionId,
    refreshToken: newRefreshToken,
    expiresAt: newExpiresAt,
  });

  const accessToken = await signAccessToken({
    sub: payload.sub,
    tenantId: payload.tenantId,
    role: membership.role,
    sessionId: payload.sessionId,
  });

  const csrf = createCsrfToken();
  const response = NextResponse.json({
    ok: true,
    csrfToken: csrf.token,
  });

  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  setAuthCookies(response, accessToken, newRefreshToken);
  setCsrfCookie(response, csrf.signed);

  return response;
}
