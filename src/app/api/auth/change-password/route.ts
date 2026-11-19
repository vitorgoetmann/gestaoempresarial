import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/server/auth/schemas";
import { prisma } from "@/server/db/prisma";
import { getAuthContext } from "@/server/auth/context";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { enforceCsrf } from "@/server/auth/csrf-guard";
import { logAudit } from "@/server/audit/logger";
import { getClientInfo } from "@/server/http/client";
import { errorPayload } from "@/server/http/errors";

export async function POST(request: NextRequest) {
  if (!enforceCsrf(request)) {
    return NextResponse.json(errorPayload("CSRF invalido", "FORBIDDEN"), {
      status: 403,
    });
  }

  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(errorPayload("Nao autorizado", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  const { ipAddress, userAgent } = getClientInfo(request);

  if (!parsed.success) {
    return NextResponse.json(errorPayload("Dados invalidos", "VALIDATION"), {
      status: 400,
    });
  }

  const user = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
  });

  if (!user) {
    return NextResponse.json(errorPayload("Usuario nao encontrado", "NOT_FOUND"), {
      status: 404,
    });
  }

  const passwordOk = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!passwordOk) {
    return NextResponse.json(errorPayload("Senha atual invalida", "UNAUTHORIZED"), {
      status: 401,
    });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await logAudit({
    tenantId: auth.tenantId,
    userId: auth.userId,
    module: "AUTH",
    action: "CHANGE_PASSWORD",
    entity: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
