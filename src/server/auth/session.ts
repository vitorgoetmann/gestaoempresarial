import crypto from "crypto";
import { prisma } from "../db/prisma";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiry(days = 30): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function createSession(params: {
  tenantId: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string;
}): Promise<{ sessionId: string; expiresAt: Date }> {
  const expiresAt = getSessionExpiry(30);
  const session = await prisma.session.create({
    data: {
      id: params.sessionId ?? crypto.randomUUID(),
      tenantId: params.tenantId,
      userId: params.userId,
      refreshTokenHash: hashToken(params.refreshToken),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt,
    },
  });

  return { sessionId: session.id, expiresAt };
}

export async function rotateSession(params: {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.session.update({
    where: { id: params.sessionId },
    data: {
      refreshTokenHash: hashToken(params.refreshToken),
      expiresAt: params.expiresAt,
    },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
    },
  });
}
