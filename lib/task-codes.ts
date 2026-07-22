// topic_code — строковый код темы в формате импорта/экспорта JSON.
// Для кодификатора ЕГЭ/ОГЭ: "EGE_PROF-13", "OGE_ENG-9" (экзамен-номер КИМ,
// экзамен уже однозначно определяет предмет — EGE_ENG/OGE_ENG под английский).
// Для общей программы предмета (видна всем репетиторам этого предмета): "GEN:Название".
// Для своих тем репетитора: "CUSTOM:Название темы".
import { Exam as ExamEnum } from "@/app/generated/prisma/enums";
import type { Exam } from "@/app/generated/prisma/enums";

const EXAM_CODE_RE = new RegExp(`^(${Object.values(ExamEnum).join("|")})-(\\d+)$`);

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
  const m = code.match(EXAM_CODE_RE);
  if (m) return { exam: m[1] as Exam, kimNumber: Number(m[2]) };
  if (code.startsWith("GEN:") && code.length > 4) {
    return { generalTitle: code.slice(4).trim() };
  }
  if (code.startsWith("CUSTOM:") && code.length > 7) {
    return { customTitle: code.slice(7).trim() };
  }
  return null;
}
