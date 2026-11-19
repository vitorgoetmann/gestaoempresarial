import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/server/auth/schemas";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { logAccess } from "@/server/auth/access-log";
import { getClientInfo } from "@/server/http/client";
import { errorPayload } from "@/server/http/errors";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  const { ipAddress, userAgent } = getClientInfo(request);

  if (!parsed.success) {
    return NextResponse.json(errorPayload("Dados invalidos", "VALIDATION"), {
      status: 400,
    });
  }

  const tokenHash = hashToken(parsed.data.token);
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
      deletedAt: null,
    },
  });

  if (!token) {
    return NextResponse.json(errorPayload("Token invalido", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAccess({
    userId: token.userId,
    action: "PASSWORD_RESET",
    success: true,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
