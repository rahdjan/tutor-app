// Proxy (бывший middleware в Next.js ≤15): быстрая «оптимистичная» проверка
// на входе в кабинеты — нет cookie сессии, значит на /login.
// Это только первый рубеж для удобства: настоящая проверка сессии и роли
// выполняется на сервере в lib/access.ts на каждой защищённой странице.
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tutor/:path*", "/student/:path*"],
};
