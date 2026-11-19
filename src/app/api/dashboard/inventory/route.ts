import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveDashboardContext } from '../_shared';

// GET /api/dashboard/inventory
export async function GET(request: NextRequest) {
  try {
    const context = await resolveDashboardContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const moves = await prisma.inventoryMovement.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { occurredAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    });
    // Transform to match front‑end shape
    const data = moves.map(m => ({
      id: m.id,
      productName: m.product?.name ?? 'Desconhecido',
      sku: m.product?.sku ?? '',
      type: m.type,
      quantity: m.quantity,
      reason: m.reason ?? '',
      user: m.user?.name ?? 'Sistema',
      occurredAt: m.occurredAt.toLocaleString('pt-BR'),
    }));
    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('GET inventory error', error);
    return NextResponse.json({ error: 'Failed to load inventory movements' }, { status: 500 });
  }
}

// POST /api/dashboard/inventory
export async function POST(request: NextRequest) {
  try {
    const context = await resolveDashboardContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const { productId, type, quantity, reason } = await request.json();
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: context.tenantId, deletedAt: null },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create inventory movement record
    const movement = await prisma.inventoryMovement.create({
      data: {
        tenantId: context.tenantId,
        productId,
        userId: context.userId,
        type,
        quantity: Number(quantity),
        reason,
        reference: product.sku ?? undefined,
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    // Adjust product stock based on movement type
    const delta =
      type === 'ENTRY' || type === 'RETURN' ? Number(quantity) : -Number(quantity);
    await prisma.product.update({
      where: { id: productId },
      data: { stockCurrent: { increment: delta } },
    });

    // Respond with the created movement in the same shape used by the UI
    const response = {
      id: movement.id,
      productName: movement.product?.name ?? 'Desconhecido',
      sku: movement.product?.sku ?? '',
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason ?? '',
      user: 'Sistema',
      occurredAt: movement.occurredAt.toLocaleString('pt-BR'),
    };

    const createdResponse = NextResponse.json(response, { status: 201 });
    createdResponse.headers.set('Cache-Control', 'no-store');
    return createdResponse;
  } catch (error) {
    console.error('POST inventory error', error);
    return NextResponse.json({ error: 'Failed to create inventory movement' }, { status: 500 });
  }
}
