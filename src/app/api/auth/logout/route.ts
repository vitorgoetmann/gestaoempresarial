import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken } from "@/server/auth/tokens";
import { REFRESH_TOKEN_COOKIE } from "@/server/auth/cookies";
import { revokeSession } from "@/server/auth/session";
import { clearAuthCookies } from "@/server/auth/response";
import { enforceCsrf } from "@/server/auth/csrf-guard";
import { logAccess } from "@/server/auth/access-log";
import { getClientInfo } from "@/server/http/client";

export async function POST(request: NextRequest) {
  const { ipAddress, userAgent } = getClientInfo(request);

  if (!enforceCsrf(request)) {
    return NextResponse.json({ error: "CSRF invalido" }, { status: 403 });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    const verified = await verifyRefreshToken(refreshToken).catch(() => null);
    if (verified) {
      await revokeSession(verified.payload.sessionId);
      await logAccess({
        tenantId: verified.payload.tenantId,
        userId: verified.payload.sub,
        action: "LOGOUT",
        success: true,
        ipAddress,
        userAgent,
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  response.headers.set("Cache-Control", "no-store");

  return response;
}
