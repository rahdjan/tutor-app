// Русские подписи для enum-значений из БД
import type { Goal } from "@/app/generated/prisma/enums";

export const GOAL_LABELS: Record<Goal, string> = {
  EGE_PROF: "ЕГЭ профиль",
  EGE_BASE: "ЕГЭ база",
  OGE: "ОГЭ",
  OTHER: "Другое",
};

export const GOALS: Goal[] = ["EGE_PROF", "EGE_BASE", "OGE", "OTHER"];
