import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/server/auth/schemas";
import { prisma } from "@/server/db/prisma";
import { logAccess } from "@/server/auth/access-log";
import { getClientInfo } from "@/server/http/client";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  const { ipAddress, userAgent } = getClientInfo(request);

  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, deletedAt: null },
  });

  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await logAccess({
      tenantId: null,
      userId: user.id,
      action: "PASSWORD_RESET",
      success: true,
      ipAddress,
      userAgent,
    });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, resetToken: token });
    }
  }

  return NextResponse.json({ ok: true });
}
