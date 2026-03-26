
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// force-dynamic важен: без него Next.js может закешировать ответ
// и не выполнять реальный запрос к БД при каждом крон-вызове.
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    // Минимальный запрос — просто проверяем живость соединения.
    // SELECT 1 не читает данные таблиц и не нагружает БД.
    await prisma.$queryRaw`SELECT 1`

    const elapsed = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db_ms: elapsed,
      ts: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[keep-alive] DB error:', message)

    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}

// POST нужен для ручного пинга через curl/Postman
export const POST = GET