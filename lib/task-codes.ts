// topic_code — строковый код темы в формате импорта/экспорта JSON.
// Для кодификатора ЕГЭ/ОГЭ: "EGE_PROF-13", "EGE_BASE-5", "OGE-20" (экзамен-номер КИМ).
// Для общей школьной программы (5–11 класс, видна всем репетиторам): "GEN:Название".
// Для своих тем репетитора: "CUSTOM:Название темы".
import type { Exam } from "@/app/generated/prisma/enums";

export function topicCode(topic: {
  exam: Exam | null;
  kimNumber: number | null;
  title: string;
  tutorId: string | null;
}): string {
  if (topic.exam && topic.kimNumber) return `${topic.exam}-${topic.kimNumber}`;
  if (topic.tutorId === null) return `GEN:${topic.title}`;
  return `CUSTOM:${topic.title}`;
}

export function parseTopicCode(
  code: string,
):
  | { exam: Exam; kimNumber: number }
  | { generalTitle: string }
  | { customTitle: string }
  | null {
  const m = code.match(/^(EGE_PROF|EGE_BASE|OGE)-(\d+)$/);
  if (m) return { exam: m[1] as Exam, kimNumber: Number(m[2]) };
  if (code.startsWith("GEN:") && code.length > 4) {
    return { generalTitle: code.slice(4).trim() };
  }
  if (code.startsWith("CUSTOM:") && code.length > 7) {
    return { customTitle: code.slice(7).trim() };
  }
  return null;
}
