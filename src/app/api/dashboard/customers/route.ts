import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, resolveDashboardContext } from "../_shared";

type CustomerPayload = {
  id?: string;
  name?: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  postalCode?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  notes?: string;
};

function serializeCustomer(customer: any) {
  return {
    id: customer.id,
    name: customer.name,
    document: customer.document ?? "",
    phone: customer.phone ?? "",
    whatsapp: customer.whatsapp ?? "",
    email: customer.email ?? "",
    postalCode: customer.postalCode ?? "",
    addressLine: customer.addressLine ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    notes: customer.notes ?? "",
    totalSpent: decimalToNumber(customer.totalSpent),
    totalOrders: customer.totalOrders,
    lastPurchaseAt: customer.lastPurchaseAt ? customer.lastPurchaseAt.toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId: context.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const response = NextResponse.json(customers.map(serializeCustomer), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CustomerPayload | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: context.tenantId,
      name: body.name.trim(),
      document: body.document?.trim() || null,
      phone: body.phone?.trim() || null,
      whatsapp: body.whatsapp?.trim() || null,
      email: body.email?.trim() || null,
      postalCode: body.postalCode?.trim() || null,
      addressLine: body.addressLine?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      notes: body.notes?.trim() || null,
      totalSpent: new Prisma.Decimal(0),
      totalOrders: 0,
    },
  });

  const response = NextResponse.json(serializeCustomer(customer), { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function PUT(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CustomerPayload | null;
  if (!body?.id) {
    return NextResponse.json({ error: "ID do cliente é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id: body.id, tenantId: context.tenantId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const customer = await prisma.customer.update({
    where: { id: body.id },
    data: {
      name: body.name?.trim() || existing.name,
      document: body.document?.trim() || null,
      phone: body.phone?.trim() || null,
      whatsapp: body.whatsapp?.trim() || null,
      email: body.email?.trim() || null,
      postalCode: body.postalCode?.trim() || null,
      addressLine: body.addressLine?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  const response = NextResponse.json(serializeCustomer(customer), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID do cliente é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id, tenantId: context.tenantId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
