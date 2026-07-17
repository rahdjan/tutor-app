"use server";

// Server actions рабочих листов. Изоляция: лист, задачи и ученики
// всегда проверяются на принадлежность текущему репетитору.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import type { FormState } from "@/app/actions/auth";

/** Лист текущего репетитора или null. */
async function ownWorksheet(worksheetId: string, tutorId: string) {
  return prisma.worksheet.findFirst({
    where: { id: worksheetId, tutorId },
  });
}

function sheetPath(id: string) {
  return `/tutor/worksheets/${id}`;
}

export async function createWorksheet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Укажите название листа." };
  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const sheet = await prisma.worksheet.create({
    data: { title, description, tags, tutorId: session.user.id },
  });
  redirect(sheetPath(sheet.id));
}

export async function updateWorksheet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Укажите название листа." };
  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const updated = await prisma.worksheet.updateMany({
    where: { id, tutorId: session.user.id },
    data: { title, description, tags },
  });
  if (updated.count === 0) return { error: "Лист не найден." };
  revalidatePath(sheetPath(id));
  return { ok: true };
}

export async function deleteWorksheet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const id = String(formData.get("id") ?? "");
  await prisma.worksheet.deleteMany({
    where: { id, tutorId: session.user.id },
  });
  redirect("/tutor/worksheets");
}

/** Добавить отмеченные задачи из банка в лист. */
export async function addWorksheetTasks(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const worksheetId = String(formData.get("worksheetId") ?? "");
  const sheet = await ownWorksheet(worksheetId, session.user.id);
  if (!sheet) return { error: "Лист не найден." };

  const taskIds = formData.getAll("taskIds").map(String).filter(Boolean);
  if (taskIds.length === 0) return { error: "Отметьте хотя бы одну задачу." };

  // Только свои задачи
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, tutorId: session.user.id },
    select: { id: true },
  });

  const last = await prisma.worksheetTask.findFirst({
    where: { worksheetId },
    orderBy: { order: "desc" },
  });
  let order = (last?.order ?? 0) + 1;
  for (const t of tasks) {
    await prisma.worksheetTask
      .create({ data: { worksheetId, taskId: t.id, order: order++ } })
      .catch(() => {}); // уже в листе — пропускаем
  }

  revalidatePath(sheetPath(worksheetId));
  return { ok: true };
}

/** Автоподбор: случайные N своих задач по фильтрам, которых ещё нет в листе. */
export async function autoPickTasks(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const worksheetId = String(formData.get("worksheetId") ?? "");
  const sheet = await ownWorksheet(worksheetId, session.user.id);
  if (!sheet) return { error: "Лист не найден." };

  const count = Math.min(Math.max(Number(formData.get("count") ?? 5) || 5, 1), 30);
  const topicId = String(formData.get("topicId") ?? "").trim();
  const diffMin = Number(formData.get("diffMin") ?? 1) || 1;
  const diffMax = Number(formData.get("diffMax") ?? 5) || 5;

  const existing = await prisma.worksheetTask.findMany({
    where: { worksheetId },
    select: { taskId: true },
  });

  const candidates = await prisma.task.findMany({
    where: {
      tutorId: session.user.id,
      id: { notIn: existing.map((e) => e.taskId) },
      difficulty: { gte: Math.min(diffMin, diffMax), lte: Math.max(diffMin, diffMax) },
      ...(topicId ? { topicId } : {}),
    },
    select: { id: true },
  });
  if (candidates.length === 0) {
    return { error: "Подходящих задач в банке не нашлось. Смягчите условия." };
  }

  // Перемешиваем и берём первые count
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, count);

  const last = await prisma.worksheetTask.findFirst({
    where: { worksheetId },
    orderBy: { order: "desc" },
  });
  let order = (last?.order ?? 0) + 1;
  for (const t of picked) {
    await prisma.worksheetTask.create({
      data: { worksheetId, taskId: t.id, order: order++ },
    });
  }

  revalidatePath(sheetPath(worksheetId));
  return { ok: true };
}

export async function removeWorksheetTask(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const worksheetId = String(formData.get("worksheetId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const sheet = await ownWorksheet(worksheetId, session.user.id);
  if (!sheet) return { error: "Лист не найден." };

  await prisma.worksheetTask.deleteMany({
    where: { id: itemId, worksheetId },
  });
  revalidatePath(sheetPath(worksheetId));
  return {};
}

export async function moveWorksheetTask(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const worksheetId = String(formData.get("worksheetId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const sheet = await ownWorksheet(worksheetId, session.user.id);
  if (!sheet) return { error: "Лист не найден." };

  const items = await prisma.worksheetTask.findMany({
    where: { worksheetId },
    orderBy: { order: "asc" },
  });
  const index = items.findIndex((i) => i.id === itemId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= items.length) return {};

  await prisma.$transaction([
    prisma.worksheetTask.update({
      where: { id: items[index].id },
      data: { order: items[swapWith].order },
    }),
    prisma.worksheetTask.update({
      where: { id: items[swapWith].id },
      data: { order: items[index].order },
    }),
  ]);
  revalidatePath(sheetPath(worksheetId));
  return {};
}

/** Выдать лист ученику — создаёт Assignment. */
export async function assignWorksheet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const worksheetId = String(formData.get("worksheetId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const dueRaw = String(formData.get("dueAt") ?? "").trim();

  const sheet = await ownWorksheet(worksheetId, session.user.id);
  if (!sheet) return { error: "Лист не найден." };

  const taskCount = await prisma.worksheetTask.count({ where: { worksheetId } });
  if (taskCount === 0) return { error: "В листе нет задач — сначала добавьте их." };

  // Ученик только свой
  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!student) return { error: "Выберите ученика." };

  const already = await prisma.assignment.findFirst({
    where: { worksheetId, studentId },
  });
  if (already) return { error: `Лист уже выдан ученику «${student.name}».` };

  await prisma.assignment.create({
    data: {
      worksheetId,
      studentId,
      tutorId: session.user.id,
      dueAt: dueRaw ? new Date(dueRaw) : null,
    },
  });

  revalidatePath(sheetPath(worksheetId));
  return { ok: true };
}
