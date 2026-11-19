import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDatePtBr, resolveDashboardContext } from "../../_shared";

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const taskId = body?.taskId as string | undefined;
  const message = String(body?.message ?? "").trim();

  if (!taskId || !message) {
    return NextResponse.json({ error: "Dados do comentário são obrigatórios" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, tenantId: context.tenantId, deletedAt: null },
  });

  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  await prisma.taskComment.create({
    data: {
      taskId,
      userId: context.userId,
      message,
    },
  });

  const updated = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { name: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
      attachments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({
    id: taskId,
    comments: (updated?.comments ?? []).map((comment) => ({
      id: comment.id,
      user: comment.user?.name ?? "Sistema",
      message: comment.message,
      date: formatDatePtBr(comment.createdAt) ?? "Agora mesmo",
    })),
  });
}
