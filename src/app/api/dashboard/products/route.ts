import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, ensureNamedProductRelation, resolveDashboardContext } from "../_shared";

type ProductPayload = {
  id?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  costPrice?: number;
  salePrice?: number;
  margin?: number;
  stockCurrent?: number;
  stockMin?: number;
  images?: string[];
};

function serializeProduct(product: any) {
  return {
    id: product.id,
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    name: product.name,
    description: product.description ?? "",
    category: product.category?.name ?? "",
    brand: product.brand?.name ?? "",
    supplier: product.supplier?.name ?? "",
    costPrice: decimalToNumber(product.costPrice),
    salePrice: decimalToNumber(product.salePrice),
    margin: decimalToNumber(product.margin),
    stockCurrent: product.stockCurrent,
    stockMin: product.stockMin,
    images: (product.images ?? []).map((image: any) => image.url),
  };
}

async function getProductContext(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return context;
}

export async function GET(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { tenantId: context.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
      category: { select: { name: true } },
      brand: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  const response = NextResponse.json(products.map(serializeProduct), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProductPayload | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 });
  }

  const [category, brand, supplier] = await Promise.all([
    ensureNamedProductRelation(context.tenantId, "productCategory", body.category),
    ensureNamedProductRelation(context.tenantId, "brand", body.brand),
    ensureNamedProductRelation(context.tenantId, "supplier", body.supplier),
  ]);

  const images = (body.images ?? []).filter(Boolean);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        tenantId: context.tenantId,
        categoryId: category?.id ?? null,
        brandId: brand?.id ?? null,
        supplierId: supplier?.id ?? null,
        sku: body.sku?.trim() || null,
        barcode: body.barcode?.trim() || null,
        name: body.name?.trim() || "Sem nome",
        description: body.description?.trim() || null,
        costPrice: new Prisma.Decimal(body.costPrice ?? 0),
        salePrice: new Prisma.Decimal(body.salePrice ?? 0),
        margin: new Prisma.Decimal(body.margin ?? 0),
        stockCurrent: Number(body.stockCurrent ?? 0),
        stockMin: Number(body.stockMin ?? 0),
      },
    });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((url, index) => ({
          productId: created.id,
          url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });
  });

  const response = NextResponse.json(serializeProduct(product), { status: 201 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function PUT(request: NextRequest) {
  const context = await resolveDashboardContext(request);
  if (!context) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProductPayload | null;
  if (!body?.id) {
    return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: body.id, tenantId: context.tenantId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const [category, brand, supplier] = await Promise.all([
    ensureNamedProductRelation(context.tenantId, "productCategory", body.category),
    ensureNamedProductRelation(context.tenantId, "brand", body.brand),
    ensureNamedProductRelation(context.tenantId, "supplier", body.supplier),
  ]);

  const images = (body.images ?? []).filter(Boolean);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: body.id },
      data: {
        categoryId: category?.id ?? null,
        brandId: brand?.id ?? null,
        supplierId: supplier?.id ?? null,
        sku: body.sku?.trim() || null,
        barcode: body.barcode?.trim() || null,
        name: body.name?.trim() || existing.name,
        description: body.description?.trim() || null,
        costPrice: new Prisma.Decimal(body.costPrice ?? 0),
        salePrice: new Prisma.Decimal(body.salePrice ?? 0),
        margin: new Prisma.Decimal(body.margin ?? 0),
        stockCurrent: Number(body.stockCurrent ?? 0),
        stockMin: Number(body.stockMin ?? 0),
      },
    });

    await tx.productImage.deleteMany({ where: { productId: body.id } });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((url, index) => ({
          productId: body.id as string,
          url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: body.id },
      include: {
        images: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });
  });

  const response = NextResponse.json(serializeProduct(updated), { status: 200 });
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
    return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { id, tenantId: context.tenantId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
