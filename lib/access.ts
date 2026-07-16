// Слой доступа к данным (Data Access Layer).
// ВСЕ серверные страницы и actions получают текущего пользователя только отсюда.
// Правило проекта: репетитор видит только своё, ученик — только выданное ему,
// поэтому каждый запрос к БД должен фильтроваться по id из этих функций.
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// cache() — чтобы за один рендер страницы сессия читалась из БД один раз,
// сколько бы компонентов её ни запросило.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Требует залогиненного пользователя, иначе отправляет на /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Пускает только репетитора. Ученика отправляет в его кабинет. */
export async function requireTutor() {
  const session = await requireUser();
  if (session.user.role !== "TUTOR") {
    redirect("/student");
  }
  return session;
}

/** Пускает только ученика. Репетитора отправляет в его кабинет. */
export async function requireStudent() {
  const session = await requireUser();
  if (session.user.role !== "STUDENT") {
    redirect("/tutor");
  }
  return session;
}
