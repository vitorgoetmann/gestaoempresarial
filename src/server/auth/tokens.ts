import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "../env";

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  role: string;
  sessionId: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  tenantId: string;
  sessionId: string;
  type: "refresh";
};

const encoder = new TextEncoder();
const accessSecret = encoder.encode(getEnv().JWT_ACCESS_SECRET);
const refreshSecret = encoder.encode(getEnv().JWT_REFRESH_SECRET);

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
  expiresIn = "15m",
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(accessSecret);
}

export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
  expiresIn = "30d",
): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string) {
  return jwtVerify<AccessTokenPayload>(token, accessSecret);
}

export async function verifyRefreshToken(token: string) {
  return jwtVerify<RefreshTokenPayload>(token, refreshSecret);
}
