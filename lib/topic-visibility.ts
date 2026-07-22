// Единая проверка видимости темы: чтобы фильтр по предмету не разъезжался
// в десятке независимых мест (task-form, банк задач, план, ИИ-импорт и т.д.).
import type { Prisma } from "@/app/generated/prisma/client";
import type { Subject } from "@/app/generated/prisma/enums";

/** Better Auth типизирует additionalFields обычной строкой — сужаем
 * session.user.subject до реального enum-значения, с дефолтом на MATH. */
export function resolveSubject(user: { subject?: string | null }): Subject {
  return (user.subject as Subject | null | undefined) ?? "MATH";
}

/** Темы, видимые репетитору: общие темы его предмета + свои личные. */
export function visibleTopicsWhere(user: {
  id: string;
  subject?: string | null;
}): Prisma.TopicWhereInput {
  return {
    subject: resolveSubject(user),
    OR: [{ tutorId: null }, { tutorId: user.id }],
  };
}
