// Единственный экземпляр Prisma-клиента на всё приложение.
// В dev-режиме Next.js перезагружает модули при каждой правке, поэтому клиент
// кладём в globalThis — иначе накопятся десятки открытых подключений к БД.
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
