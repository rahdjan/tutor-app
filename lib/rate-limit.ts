// Собственный rate limiter для server actions (Better Auth свой лимитер
// применяет только к HTTP-запросам через app/api/auth/[...all] — вызовы
// auth.api.* из наших actions мимо него, см. lib/auth.ts).
//
// Fixed-window на Postgres, без единой строки сырого SQL: каждый шаг —
// одиночный условный UPDATE (атомарен в Postgres) либо create под unique(key).
// Таблица app_rate_limit отдельная от таблицы Better Auth: та периодически
// чистит свои строки по короткому cutoff и стёрла бы наши часовые/суточные окна.
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type RateLimitRule = { windowSec: number; max: number };
export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  // В разработке лимиты только мешают — включаем принудительно флагом
  // для собственных e2e-проверок лимитера.
  if (process.env.NODE_ENV !== "production" && process.env.FORCE_RATE_LIMIT !== "1") {
    return { allowed: true };
  }

  const now = new Date();
  const windowStartCutoff = new Date(now.getTime() - rule.windowSec * 1000);

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      // 1) Окно ещё живо и лимит не исчерпан — атомарный инкремент.
      const incremented = await prisma.appRateLimit.updateMany({
        where: { key, windowStart: { gt: windowStartCutoff }, count: { lt: rule.max } },
        data: { count: { increment: 1 } },
      });
      if (incremented.count === 1) return { allowed: true };

      // 2) Окно истекло — атомарный сброс на новое окно.
      const reset = await prisma.appRateLimit.updateMany({
        where: { key, windowStart: { lte: windowStartCutoff } },
        data: { count: 1, windowStart: now },
      });
      if (reset.count === 1) return { allowed: true };

      const row = await prisma.appRateLimit.findUnique({ where: { key } });
      if (!row) {
        // 3) Строки ещё нет — создаём; параллельный create упадёт на unique(key).
        try {
          await prisma.appRateLimit.create({
            data: { key, count: 1, windowStart: now },
          });
          return { allowed: true };
        } catch {
          continue; // кто-то создал параллельно — новый круг разберётся
        }
      }

      // 4) Окно живо и лимит исчерпан — отказ.
      if (row.count >= rule.max && row.windowStart > windowStartCutoff) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil(
            (row.windowStart.getTime() + rule.windowSec * 1000 - now.getTime()) / 1000,
          ),
        );
        return { allowed: false, retryAfterSec };
      }
      // Состояние изменилось между шагами — повторяем цикл.
    }
    // Три гонки подряд — крайне маловероятно; пропускаем запрос (best effort).
    return { allowed: true };
  } catch (error) {
    // Сбой БД не должен блокировать вход/регистрацию — а без БД они и так
    // не сработают. Fail-open здесь не ослабляет защиту.
    console.error("Rate limit error:", error);
    return { allowed: true };
  }
}

/** IP клиента. На Vercel x-real-ip/x-forwarded-for ставит прокси — не подделать. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** Текст для пользователя: «Попробуйте через …». */
export function retryHint(sec: number): string {
  return sec < 90 ? "Попробуйте через минуту." : `Попробуйте через ${Math.ceil(sec / 60)} мин.`;
}
