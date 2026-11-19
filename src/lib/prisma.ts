import { PrismaClient } from "@prisma/client";

declare global {
  // Allows global `prisma` variable in development without polluting production
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Prevent multiple instances of Prisma Client in development (hot reload)
  global.prisma = prisma;
}
