import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 🔐 Впиши сюда email-ы тех, кто имеет право заходить в админку
const ADMIN_EMAILS = [
  'sanduroman@gmail.com', 
  'rsandy@yandex.ru'
];

export async function middleware(request: NextRequest) {
  // Инициализируем response, который может быть изменен внутри setAll
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Создаем SSR-клиент Supabase для Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: Используем getUser() вместо getSession(), так как он безопасно 
  // проверяет токен на сервере Supabase, а не просто читает куку
  const { data: { user } } = await supabase.auth.getUser()

  // 🛡️ ЛОГИКА ЗАЩИТЫ МАРШРУТОВ /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Если пользователь вообще не авторизован -> шлем на главную (или на страницу логина)
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/' // Можно заменить на '/login', если есть отдельная страница
      
      // Опционально: можно добавить параметр ?redirected=true чтобы показать тост
      return NextResponse.redirect(url)
    }

    // 2. Если авторизован, но email не в списке админов -> шлем на главную
    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Если всё ок — пропускаем запрос дальше
  return supabaseResponse
}

// Указываем, для каких путей вообще должен срабатывать этот middleware
export const config = {
  matcher: [
    /*
     * Матчит все пути запросов, КРОМЕ:
     * - _next/static (статика)
     * - _next/image (оптимизация картинок)
     * - favicon.ico (файл фавиконки)
     * - изображений и шрифтов
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}