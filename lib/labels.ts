// Русские подписи для enum-значений из БД
import type {
  Exam,
  Goal,
  LessonStatus,
  PlanStatus,
  Subject,
} from "@/app/generated/prisma/enums";

export const GOAL_LABELS: Record<Goal, string> = {
  EGE_PROF: "ЕГЭ профиль",
  EGE_BASE: "ЕГЭ база",
  OGE: "ОГЭ",
  EGE_ENG: "ЕГЭ английский",
  OGE_ENG: "ОГЭ английский",
  OTHER: "Другое",
};

export const GOALS: Goal[] = ["EGE_PROF", "EGE_BASE", "OGE", "EGE_ENG", "OGE_ENG", "OTHER"];

// Какие цели предлагать ученику в зависимости от предмета репетитора —
// нельзя завести математическому ученику цель «ЕГЭ английский» и наоборот.
export const GOALS_BY_SUBJECT: Record<Subject, Goal[]> = {
  MATH: ["EGE_PROF", "EGE_BASE", "OGE", "OTHER"],
  ENGLISH: ["EGE_ENG", "OGE_ENG", "OTHER"],
};

export const EXAM_LABELS: Record<Exam, string> = {
  EGE_PROF: "ЕГЭ профиль",
  EGE_BASE: "ЕГЭ база",
  OGE: "ОГЭ",
  EGE_ENG: "ЕГЭ английский",
  OGE_ENG: "ОГЭ английский",
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
