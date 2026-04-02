// src/lib/prisma.ts (или где он у вас лежит)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  return new PrismaClient({
    // URL и параметры (connection_limit, pgbouncer, таймауты) 
    // Prisma автоматически прочитает из process.env.DATABASE_URL
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma