// Конфигурация Better Auth — серверная часть авторизации.
// Секреты берутся из переменных окружения: BETTER_AUTH_SECRET, BETTER_AUTH_URL.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Rate limit для прямых HTTP-запросов к /api/auth/* (curl-перебор в обход
  // наших форм). Вызовы auth.api.* из server actions (login/registerTutor/
  // registerStudent в app/actions/auth.ts) через этот лимитер НЕ проходят —
  // для них отдельная защита в lib/rate-limit.ts, врезанная прямо в actions.
  // storage: "database" — Vercel поднимает несколько инстансов, in-memory
  // счётчик каждый из них видел бы свой.
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 3600, max: 10 },
      "/get-session": false,
    },
  },

  user: {
    additionalFields: {
      // role и tutorId нельзя передать с клиента (input: false) — их выставляет
      // только наш серверный код. Это защита от подделки роли через API.
      role: { type: "string", required: false, input: false },
      tutorId: { type: "string", required: false, input: false },
      // Предмет репетитора: хоть его и выбирает сам пользователь в форме,
      // запись всё равно делает только сервер (см. registerTutor/
      // registerStudent) — та же защита от подделки через сырой API-запрос.
      subject: { type: "string", required: false, input: false },
      // Согласия приходят из формы регистрации и проверяются хуком ниже.
      consentAccepted: { type: "boolean", required: true, input: true },
      under16: { type: "boolean", required: false, input: true },
      parentConsentAccepted: { type: "boolean", required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Страховка на уровне сервера: без согласия аккаунт не создаётся,
        // даже если кто-то обратится к API в обход наших форм.
        before: async (user) => {
          const u = user as typeof user & {
            consentAccepted?: boolean;
            under16?: boolean;
            parentConsentAccepted?: boolean;
          };
          if (!u.consentAccepted) {
            throw new APIError("BAD_REQUEST", {
              message: "Для регистрации нужно согласие на обработку персональных данных.",
            });
          }
          if (u.under16 && !u.parentConsentAccepted) {
            throw new APIError("BAD_REQUEST", {
              message: "Для учеников младше 16 лет требуется согласие родителя.",
            });
          }
          return { data: user };
        },
      },
    },
  },

  // nextCookies должен идти последним: он позволяет server actions
  // устанавливать cookie сессии после входа/регистрации.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
