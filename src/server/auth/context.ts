import { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { verifyAccessToken } from "./tokens";

export type AuthContext = {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
};

export async function getAuthContext(
  request: NextRequest,
): Promise<AuthContext | null> {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await verifyAccessToken(token);
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  } catch {
    return null;
  }
}
