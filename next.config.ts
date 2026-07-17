import type { NextConfig } from "next";

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
};

export default nextConfig;
