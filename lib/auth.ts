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

  user: {
    additionalFields: {
      // role и tutorId нельзя передать с клиента (input: false) — их выставляет
      // только наш серверный код. Это защита от подделки роли через API.
      role: { type: "string", required: false, input: false },
      tutorId: { type: "string", required: false, input: false },
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
