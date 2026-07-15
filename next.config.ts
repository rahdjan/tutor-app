import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // В домашней папке пользователя лежит посторонний package-lock.json —
  // фиксируем корень проекта явно, чтобы Turbopack не выбирал его.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
