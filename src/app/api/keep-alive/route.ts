import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Отключаем кэширование, чтобы запрос всегда долетал до базы
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Делаем самый легкий запрос, который ничего не весит
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase is awake!' 
    });
  } catch (error: any) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}