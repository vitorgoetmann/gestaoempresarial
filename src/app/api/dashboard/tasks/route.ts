import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDatePtBr, parseDateOrNull, resolveDashboardContext } from "../_shared";

type TaskPayload = {
  id?: string;
  title?: string;
  description?: string;
  status?: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  assignee?: string;
};

async function ensureAssigneeUser(name: string | undefined, fallbackUserId: string) {
  const cleaned = name?.trim();
  if (!cleaned) {
    return fallbackUserId;
  }

  const existing = await prisma.user.findFirst({
    where: { name: cleaned, deletedAt: null },
  });

  if (existing) {
    return existing.id;
  }

  const safeEmail = `${cleaned.toLowerCase().replace(/[^a-z0-9]+/g, ".")}+${crypto.randomUUID().slice(0, 8)}@local.invalid`;
  const user = await prisma.user.create({
    data: {
      name: cleaned,
      email: safeEmail,
      passwordHash: await import("@/server/auth/password").then((mod) => mod.hashPassword(crypto.randomUUID())),
      status: "ACTIVE",
    },
  });

  return user.id;
}

function serializeTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: formatDatePtBr(task.dueDate) ?? "",
    assignee: task.assignee?.name ?? "",
    comments: (task.comments ?? []).map((comment: any) => ({
      id: comment.id,
      user: comment.user?.name ?? "Sistema",
      message: comment.message,
      date: formatDatePtBr(comment.createdAt) ?? "Agora mesmo",
    })),
    attachments: (task.attachments ?? []).map((attachment: any) => ({
      name: attachment.fileName,
      url: attachment.fileUrl,
    })),
  };
}

export async function GET(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { tenantId: context.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
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

  const response = NextResponse.json(tasks.map(serializeTask), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TaskPayload | null;
  if (!body?.title) {
    return NextResponse.json({ error: "Título da tarefa é obrigatório" }, { status: 400 });
  }

  const assigneeId = await ensureAssigneeUser(body.assignee, context.userId);
  const task = await prisma.task.create({
    data: {
      tenantId: context.tenantId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      status: body.status ?? "PENDING",
      priority: body.priority ?? "MEDIUM",
      dueDate: parseDateOrNull(body.dueDate) ?? new Date(),
      creatorId: context.userId,
      assigneeId,
    },
    include: {
      assignee: { select: { name: true } },
      comments: { include: { user: { select: { name: true } } } },
      attachments: true,
    },
  });

  const response = NextResponse.json(serializeTask(task), { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function PUT(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TaskPayload | null;
  if (!body?.id) {
    return NextResponse.json({ error: "ID da tarefa é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.task.findFirst({
    where: { id: body.id, tenantId: context.tenantId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  const assigneeId = body.assignee ? await ensureAssigneeUser(body.assignee, context.userId) : existing.assigneeId;
  const task = await prisma.task.update({
    where: { id: body.id },
    data: {
      status: body.status ?? existing.status,
      title: body.title?.trim() || existing.title,
      description: body.description?.trim() || existing.description,
      priority: body.priority ?? existing.priority,
      dueDate: parseDateOrNull(body.dueDate) ?? existing.dueDate,
      assigneeId,
    },
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

  const response = NextResponse.json(serializeTask(task), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
