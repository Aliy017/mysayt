/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasourceUrl: "postgresql://postgres:Mysayt2026Admin@localhost:5432/mysayt?schema=public",
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
