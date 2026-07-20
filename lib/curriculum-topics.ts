// Общие для сида/промпта/UI константы школьного кодификатора (5–11 класс).
// Импорт EXAM_LABELS — относительный (не через алиас "@/"): этот файл
// напрямую подключается из prisma/seed.ts, который выполняется чистым Node
// без бандлера Next.js, где алиас "@/" не резолвится.
import type { Exam } from "@/app/generated/prisma/enums";
import { EXAM_LABELS } from "./labels.ts";

// Единая точка истины на название темы-катчера — чтобы строка не
// разъезжалась между сидом, промптом ИИ и резолвом topic_code.
export const OTHER_TOPIC_TITLE = "Другое";

/** Подпись темы в выпадающих списках: под ЕГЭ/ОГЭ, под классом или как есть. */
export function formatTopicLabel(topic: {
  title: string;
  exam: Exam | null;
  kimNumber: number | null;
  grade: number | null;
  section: string | null;
}): string {
  if (topic.exam) {
    return topic.kimNumber
      ? `${EXAM_LABELS[topic.exam]} №${topic.kimNumber} · ${topic.title}`
      : `${EXAM_LABELS[topic.exam]} · ${topic.title}`;
  }
  if (topic.grade) {
    return topic.section
      ? `${topic.grade} класс · ${topic.section} · ${topic.title}`
      : `${topic.grade} класс · ${topic.title}`;
  }
  return topic.title;
}
