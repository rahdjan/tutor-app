// Русские подписи для enum-значений из БД
import type {
  Exam,
  Goal,
  LessonStatus,
  PlanStatus,
} from "@/app/generated/prisma/enums";

export const GOAL_LABELS: Record<Goal, string> = {
  EGE_PROF: "ЕГЭ профиль",
  EGE_BASE: "ЕГЭ база",
  OGE: "ОГЭ",
  OTHER: "Другое",
};

export const GOALS: Goal[] = ["EGE_PROF", "EGE_BASE", "OGE", "OTHER"];

export const EXAM_LABELS: Record<Exam, string> = {
  EGE_PROF: "ЕГЭ профиль",
  EGE_BASE: "ЕГЭ база",
  OGE: "ОГЭ",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  NOT_STARTED: "Не начата",
  IN_PROGRESS: "В работе",
  MASTERED: "Освоена",
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  SCHEDULED: "Запланирован",
  DONE: "Проведён",
  CANCELLED: "Отменён",
};
