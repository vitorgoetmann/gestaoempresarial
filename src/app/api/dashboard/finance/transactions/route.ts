import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, parseDateOrNull, resolveDashboardContext } from "../../_shared";

type TransactionPayload = {
  type?: "INCOME" | "EXPENSE";
  amount?: number;
  description?: string;
  category?: string;
  status?: "PAID" | "PENDING";
  dueDate?: string | null;
  accountId?: string | null;
};

async function ensureDefaultAccounts(tenantId: string) {
  const accounts = await prisma.financialAccount.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (accounts.length > 0) {
    return accounts;
  }

  await prisma.financialAccount.createMany({
    data: [
      { tenantId, name: "Caixa Operacional", type: "CASH", balance: 0 },
      { tenantId, name: "Banco Principal", type: "BANK", balance: 0 },
    ],
  });

  return prisma.financialAccount.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

async function ensureCategory(tenantId: string, name: string, type: "INCOME" | "EXPENSE") {
  const cleaned = name.trim();
  const existing = await prisma.financialCategory.findFirst({
    where: { tenantId, name: cleaned },
  });

  if (existing) {
    return existing;
  }

  return prisma.financialCategory.create({
    data: {
      tenantId,
      name: cleaned,
      type,
    },
  });
}

function serializeTransaction(transaction: any) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: decimalToNumber(transaction.amount),
    description: transaction.description ?? "",
    category: transaction.category?.name ?? "",
    status: transaction.status,
    dueDate: transaction.dueDate ? transaction.dueDate.toISOString() : null,
    paidAt: transaction.paidAt ? transaction.paidAt.toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureDefaultAccounts(context.tenantId);

  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId: context.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      account: { select: { id: true, name: true } },
    },
  });

  const response = NextResponse.json(transactions.map(serializeTransaction), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TransactionPayload | null;
  if (!body?.type || !body.amount || !body.description) {
    return NextResponse.json({ error: "Dados do lançamento são obrigatórios" }, { status: 400 });
  }

  const accounts = await ensureDefaultAccounts(context.tenantId);
  const accountId = body.accountId || accounts[0]?.id || null;
  const category = await ensureCategory(context.tenantId, body.category || (body.type === "INCOME" ? "Receitas avulsas" : "Despesas avulsas"), body.type);
  const amount = new Prisma.Decimal(body.amount);
  const dueDate = parseDateOrNull(body.dueDate);
  const status = body.status ?? "PAID";
  const paidAt = status === "PAID" ? new Date() : null;

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.financialTransaction.create({
      data: {
        tenantId: context.tenantId,
        accountId,
        categoryId: category.id,
        type: body.type as "INCOME" | "EXPENSE",
        amount,
        description: body.description?.trim() || null,
        status,
        dueDate,
        paidAt,
      },
      include: {
        category: { select: { name: true } },
        account: { select: { id: true, name: true } },
      },
    });

    if (accountId && status === "PAID") {
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: body.type === "INCOME"
            ? { increment: amount }
            : { decrement: amount },
        },
      });
    }

    return created;
  });

  const response = NextResponse.json(serializeTransaction(transaction), { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
