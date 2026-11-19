// src/lib/repositories/customerRepository.ts
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

export type CustomerCreateInput = {
  tenantId: string;
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  postalCode?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
};

export type CustomerUpdateInput = Partial<CustomerCreateInput> & { id: string };

export const customerRepository = {
  async getAll(tenantId: string, skip = 0, take = 20) {
    return prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(tenantId: string, id: string) {
    return prisma.customer.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
  },

  async create(data: CustomerCreateInput) {
    return prisma.customer.create({
      data,
    });
  },

  async update({ id, ...data }: CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
    });
  },

  async softDelete(tenantId: string, id: string) {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
