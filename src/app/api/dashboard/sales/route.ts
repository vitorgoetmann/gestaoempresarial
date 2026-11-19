import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatDatePtBr, resolveDashboardContext } from "../_shared";

type SaleItemPayload = {
  productId: string;
  name?: string;
  quantity: number;
  price: number;
};

type SalePayload = {
  customerId?: string | null;
  customerName?: string;
  items?: SaleItemPayload[];
  subtotal?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  installments?: number;
  date?: string;
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

async function ensureIncomeCategory(tenantId: string) {
  const existing = await prisma.financialCategory.findFirst({
    where: { tenantId, name: "Vendas" },
  });

  if (existing) {
    return existing;
  }

  return prisma.financialCategory.create({
    data: {
      tenantId,
      name: "Vendas",
      type: "INCOME",
    },
  });
}

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SalePayload | null;
  if (!body?.items?.length) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  const accounts = await ensureDefaultAccounts(context.tenantId);
  const incomeCategory = await ensureIncomeCategory(context.tenantId);
  const accountId = accounts[0]?.id ?? null;
  const saleDate = body.date ? new Date(body.date) : new Date();
  const subtotal = new Prisma.Decimal(body.subtotal ?? 0);
  const discount = new Prisma.Decimal(body.discount ?? 0);
  const total = new Prisma.Decimal(body.total ?? 0);

  const result = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        tenantId: context.tenantId,
        customerId: body.customerId || null,
        status: "PAID",
        subtotal,
        discount,
        tax: new Prisma.Decimal(0),
        total,
        saleDate,
      },
    });

    for (const item of body.items ?? []) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId: context.tenantId, deletedAt: null },
      });

      if (!product) {
        throw new Error(`Produto ${item.productId} não encontrado`);
      }

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: Number(item.quantity),
          unitPrice: new Prisma.Decimal(item.price),
          total: new Prisma.Decimal(item.price).mul(item.quantity),
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockCurrent: { decrement: Number(item.quantity) },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: context.tenantId,
          productId: product.id,
          userId: context.userId,
          type: "EXIT",
          quantity: Number(item.quantity),
          reason: `Venda ${sale.id.slice(0, 8)}`,
          reference: sale.id,
        },
      });
    }

    if (body.customerId) {
      await tx.customer.update({
        where: { id: body.customerId },
        data: {
          totalSpent: { increment: total },
          totalOrders: { increment: 1 },
          lastPurchaseAt: saleDate,
        },
      });
    }

    const transaction = await tx.financialTransaction.create({
      data: {
        tenantId: context.tenantId,
        accountId,
        categoryId: incomeCategory.id,
        customerId: body.customerId || null,
        saleId: sale.id,
        type: "INCOME",
        amount: total,
        description: `Venda ${sale.id.slice(0, 8)}`,
        status: "PAID",
        paidAt: saleDate,
      },
    });

    if (accountId) {
      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: { increment: total } },
      });
    }

    return { sale, transaction };
  });

  const response = NextResponse.json(
    {
      id: result.sale.id,
      customerName: body.customerName ?? "Consumidor Final",
      items: body.items ?? [],
      subtotal: decimalToNumber(subtotal),
      discount: decimalToNumber(discount),
      total: decimalToNumber(total),
      paymentMethod: body.paymentMethod ?? "PIX",
      installments: body.installments ?? 1,
      date: formatDatePtBr(saleDate) ?? saleDate.toLocaleString("pt-BR"),
    },
    { status: 201 },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
