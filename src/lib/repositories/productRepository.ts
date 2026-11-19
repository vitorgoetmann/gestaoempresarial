// src/lib/repositories/productRepository.ts
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

export type ProductCreateInput = {
  tenantId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  salePrice?: number;
  margin?: number;
  stockCurrent?: number;
  stockMin?: number;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
};

export type ProductUpdateInput = Partial<ProductCreateInput> & { id: string };

export const productRepository = {
  async getAll(tenantId: string, skip = 0, take = 20) {
    return prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(tenantId: string, id: string) {
    return prisma.product.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
  },

  async create(data: ProductCreateInput) {
    return prisma.product.create({ data });
  },

  async update({ id, ...data }: ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },

  async softDelete(tenantId: string, id: string) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
