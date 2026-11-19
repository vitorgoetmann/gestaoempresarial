import argon2 from "argon2";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("Admin@123");

  const user = await prisma.user.create({
    data: {
      name: "Admin Master",
      email: "admin@gestao.local",
      passwordHash,
      status: "ACTIVE",
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: "Vega Distribuidora",
      slug: "vega-distribuidora",
      status: "ACTIVE",
      ownerId: user.id,
      industry: "Distribuidora",
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  const [category, brand, supplier] = await Promise.all([
    prisma.productCategory.create({
      data: { tenantId: tenant.id, name: "Autopecas" },
    }),
    prisma.brand.create({
      data: { tenantId: tenant.id, name: "MotorPro" },
    }),
    prisma.supplier.create({
      data: { tenantId: tenant.id, name: "Fabrica Lima", email: "vendas@fabricalima.com" },
    }),
  ]);

  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: category.id,
      brandId: brand.id,
      supplierId: supplier.id,
      sku: "MTR-4001",
      barcode: "7890000000012",
      name: "Kit Correia Dentada",
      description: "Kit completo para motores 1.0 a 1.6",
      costPrice: new Prisma.Decimal("120.00"),
      salePrice: new Prisma.Decimal("219.90"),
      margin: new Prisma.Decimal("99.90"),
      stockCurrent: 32,
      stockMin: 8,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Oficina Nova Era",
      document: "12.345.678/0001-90",
      phone: "(11) 90000-0000",
      email: "financeiro@novaera.com",
      city: "Sao Paulo",
      state: "SP",
      totalSpent: new Prisma.Decimal("12890.40"),
      totalOrders: 18,
      lastPurchaseAt: new Date(),
    },
  });

  const sale = await prisma.sale.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      status: "PAID",
      subtotal: new Prisma.Decimal("219.90"),
      discount: new Prisma.Decimal("0.00"),
      tax: new Prisma.Decimal("0.00"),
      total: new Prisma.Decimal("219.90"),
      saleDate: new Date(),
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: sale.id,
      productId: product.id,
      quantity: 1,
      unitPrice: new Prisma.Decimal("219.90"),
      total: new Prisma.Decimal("219.90"),
    },
  });

  await prisma.salePayment.create({
    data: {
      saleId: sale.id,
      amount: new Prisma.Decimal("219.90"),
      method: "PIX",
      status: "PAID",
      paidAt: new Date(),
    },
  });

  const cashAccount = await prisma.financialAccount.create({
    data: {
      tenantId: tenant.id,
      name: "Caixa Operacional",
      type: "CASH",
      balance: new Prisma.Decimal("50210.22"),
    },
  });

  const incomeCategory = await prisma.financialCategory.create({
    data: {
      tenantId: tenant.id,
      name: "Vendas",
      type: "INCOME",
    },
  });

  await prisma.financialTransaction.create({
    data: {
      tenantId: tenant.id,
      accountId: cashAccount.id,
      categoryId: incomeCategory.id,
      customerId: customer.id,
      saleId: sale.id,
      type: "INCOME",
      amount: new Prisma.Decimal("219.90"),
      status: "PAID",
      paidAt: new Date(),
      description: "Venda PIX #" + sale.id.slice(0, 8),
    },
  });

  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      title: "Revisar estoque critico",
      description: "Verificar itens com estoque abaixo do minimo.",
      status: "PENDING",
      priority: "HIGH",
      creatorId: user.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: "Auto Center Prime",
      email: "compras@autocenterprime.com",
      phone: "(11) 95555-5555",
      status: "QUALIFIED",
      source: "Formulario Site",
    },
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      type: "ALERT",
      title: "Estoque baixo",
      message: "Kit Correia Dentada abaixo do minimo configurado.",
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      tenantId: tenant.id,
      productId: product.id,
      userId: user.id,
      type: "ENTRY",
      quantity: 12,
      reason: "Reposicao de fornecedor",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
