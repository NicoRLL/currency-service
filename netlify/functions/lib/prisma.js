import { PrismaClient } from "@prisma/client";

let prisma = globalThis.__PRISMA__;
if (!prisma) {
  prisma = new PrismaClient();
  prisma.$connect().catch((e) => {
    console.error("Prisma $connect error:", e);
  });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__PRISMA__ = prisma;
  }
}
export { prisma };
