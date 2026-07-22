// Общая логика группировки тем в UI — переиспользуется в
// add-topics-form.tsx (план ученика) и task-form.tsx (форма задачи), чтобы
// правило группировки не расходилось между двумя независимыми копиями.
import type { Exam } from "@/app/generated/prisma/enums";
import { EXAM_LABELS } from "@/lib/labels";
import { OTHER_TOPIC_TITLE } from "@/lib/curriculum-topics";

export type TopicGroupBy = "exam" | "grade" | "section";

type GroupableTopic = {
  exam: Exam | null;
  grade?: number | null;
  section?: string | null;
};

/** Ключ группы: кодификатор — по экзамену, школьная программа — по классу,
 * английская программа — по разделу (Части речи, Аудирование и т.п.). */
export function topicGroupKey(t: GroupableTopic, groupBy?: TopicGroupBy): string {
  if (groupBy === "exam") return t.exam ?? "_";
  if (groupBy === "grade") return t.grade ? String(t.grade) : "other";
  if (groupBy === "section") return t.section ?? "other";
  return "_";
}

export function topicGroupLabel(key: string, groupBy?: TopicGroupBy): string {
  if (groupBy === "exam") return EXAM_LABELS[key as Exam];
  if (groupBy === "grade") return key === "other" ? OTHER_TOPIC_TITLE : `${key} класс`;
  if (groupBy === "section") return key === "other" ? OTHER_TOPIC_TITLE : key;
  return key;
}
