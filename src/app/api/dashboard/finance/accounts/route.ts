import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, resolveDashboardContext } from "../../_shared";

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

export async function GET(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const accounts = await ensureDefaultAccounts(context.tenantId);
  const response = NextResponse.json(
    accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: decimalToNumber(account.balance),
    })),
    { status: 200 },
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
