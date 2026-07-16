"use server";

// Server actions программы подготовки. Изоляция: каждый вызов сначала
// проверяет, что карточка ученика принадлежит текущему репетитору.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import type { FormState } from "@/app/actions/auth";
import type { PlanStatus } from "@/app/generated/prisma/enums";

const PLAN_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "MASTERED"] as const;

/** Карточка ученика текущего репетитора + её план (создаётся при первом обращении). */
async function requireOwnPlan(studentId: string) {
  const session = await requireTutor();
  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!student) return null;

  const existing = await prisma.studyPlan.findFirst({
    where: { studentId: student.id },
  });
  const plan =
    existing ??
    (await prisma.studyPlan.create({ data: { studentId: student.id } }));
  return { session, student, plan };
}

function planPath(studentId: string) {
  return `/tutor/students/${studentId}/plan`;
}

/** Добавить выбранные темы кодификатора (или свои) в программу. */
export async function addPlanTopics(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const ctx = await requireOwnPlan(studentId);
  if (!ctx) return { error: "Карточка не найдена." };

  const topicIds = formData.getAll("topicIds").map(String).filter(Boolean);
  if (topicIds.length === 0) return { error: "Отметьте хотя бы одну тему." };

  // Берём только доступные темы: общий кодификатор или свои.
  const topics = await prisma.topic.findMany({
    where: {
      id: { in: topicIds },
      OR: [{ tutorId: null }, { tutorId: ctx.session.user.id }],
    },
    select: { id: true },
  });

  const last = await prisma.planItem.findFirst({
    where: { planId: ctx.plan.id },
    orderBy: { order: "desc" },
  });
  let order = (last?.order ?? 0) + 1;

  for (const t of topics) {
    // Уже добавленную тему пропускаем (unique planId+topicId).
    await prisma.planItem
      .create({ data: { planId: ctx.plan.id, topicId: t.id, order: order++ } })
      .catch(() => {});
  }

  revalidatePath(planPath(studentId));
  return { ok: true };
}

/** Создать свою тему и сразу добавить в программу. */
export async function addCustomTopic(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Введите название темы." };

  const ctx = await requireOwnPlan(studentId);
  if (!ctx) return { error: "Карточка не найдена." };

  const topic = await prisma.topic.create({
    data: { title, tutorId: ctx.session.user.id },
  });
  const last = await prisma.planItem.findFirst({
    where: { planId: ctx.plan.id },
    orderBy: { order: "desc" },
  });
  await prisma.planItem.create({
    data: {
      planId: ctx.plan.id,
      topicId: topic.id,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(planPath(studentId));
  return { ok: true };
}

/** Обновить статус освоения и плановую дату темы. */
export async function updatePlanItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const dateRaw = String(formData.get("plannedFor") ?? "").trim();

  const ctx = await requireOwnPlan(studentId);
  if (!ctx) return { error: "Карточка не найдена." };

  const status = (PLAN_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as PlanStatus)
    : undefined;

  const updated = await prisma.planItem.updateMany({
    where: { id: itemId, planId: ctx.plan.id },
    data: { status, plannedFor: dateRaw ? new Date(dateRaw) : null },
  });
  if (updated.count === 0) return { error: "Тема не найдена." };

  revalidatePath(planPath(studentId));
  return { ok: true };
}

/** Убрать тему из программы. */
export async function removePlanItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");

  const ctx = await requireOwnPlan(studentId);
  if (!ctx) return { error: "Карточка не найдена." };

  await prisma.planItem.deleteMany({
    where: { id: itemId, planId: ctx.plan.id },
  });

  revalidatePath(planPath(studentId));
  return { ok: true };
}

/** Передвинуть тему вверх или вниз. */
export async function movePlanItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const ctx = await requireOwnPlan(studentId);
  if (!ctx) return { error: "Карточка не найдена." };

  const items = await prisma.planItem.findMany({
    where: { planId: ctx.plan.id },
    orderBy: { order: "asc" },
  });
  const index = items.findIndex((i) => i.id === itemId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= items.length) return {};

  // Меняем местами значения order соседних тем.
  await prisma.$transaction([
    prisma.planItem.update({
      where: { id: items[index].id },
      data: { order: items[swapWith].order },
    }),
    prisma.planItem.update({
      where: { id: items[swapWith].id },
      data: { order: items[index].order },
    }),
  ]);

  revalidatePath(planPath(studentId));
  return {};
}
