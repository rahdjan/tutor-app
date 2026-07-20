import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP построена под фактический состав страницы: сторонних скриптов нет,
// KaTeX бандлится и рендерится инлайн-стилями, фото решений отдаёт только
// наш /api/solution-photo. 'unsafe-inline' в script-src — вынужденный
// компромисс App Router (инлайн-бутстрап RSC без nonce); XSS закрыт
// экранированием в lib/latex.ts — CSP здесь второй, а не единственный рубеж.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // В домашней папке пользователя лежит посторонний package-lock.json —
  // фиксируем корень проекта явно, чтобы Turbopack не выбирал его.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // PDF для ИИ-импорта может весить несколько мегабайт
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // Vercel сам добавляет HSTS для *.vercel.app; явный заголовок
          // покрывает и кастомный домен, если он появится позже.
          // Без preload: это необратимый шаг, для него нужно отдельное решение.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
