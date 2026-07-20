"use server";

// Server actions банка задач. Изоляция: все операции фильтруются по tutorId.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import { parseTopicCode } from "@/lib/task-codes";
import { consumeRateLimit, retryHint } from "@/lib/rate-limit";
import type { AnswerType } from "@/app/generated/prisma/enums";
import type { FormState } from "@/app/actions/auth";

function readTaskFields(formData: FormData) {
  const statement = String(formData.get("statement") ?? "").trim();
  const answerTypeRaw = String(formData.get("answerType") ?? "SHORT");
  const answerType: AnswerType =
    answerTypeRaw === "DETAILED" ? "DETAILED" : "SHORT";
  const answer = String(formData.get("answer") ?? "").trim() || null;
  const solution = String(formData.get("solution") ?? "").trim() || null;
  const difficultyRaw = Number(formData.get("difficulty") ?? 3);
  const difficulty =
    Number.isInteger(difficultyRaw) && difficultyRaw >= 1 && difficultyRaw <= 5
      ? difficultyRaw
      : 3;
  const source = String(formData.get("source") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const topicId = String(formData.get("topicId") ?? "").trim() || null;
  return { statement, answerType, answer, solution, difficulty, source, tags, topicId };
}

/** Тема доступна репетитору: из общего кодификатора или своя. */
async function resolveAllowedTopicId(topicId: string | null, tutorId: string) {
  if (!topicId) return null;
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, OR: [{ tutorId: null }, { tutorId }] },
    select: { id: true },
  });
  return topic?.id ?? null;
}

export async function createTask(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const fields = readTaskFields(formData);
  if (!fields.statement) return { error: "Введите условие задачи." };
  if (fields.answerType === "SHORT" && !fields.answer) {
    return { error: "Для задачи с кратким ответом укажите ответ — иначе автопроверка не сработает." };
  }

  await prisma.task.create({
    data: {
      ...fields,
      topicId: await resolveAllowedTopicId(fields.topicId, session.user.id),
      tutorId: session.user.id,
    },
  });
  redirect("/tutor/tasks");
}

export async function updateTask(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const id = String(formData.get("id") ?? "");
  const fields = readTaskFields(formData);
  if (!fields.statement) return { error: "Введите условие задачи." };
  if (fields.answerType === "SHORT" && !fields.answer) {
    return { error: "Для задачи с кратким ответом укажите ответ." };
  }

  const updated = await prisma.task.updateMany({
    where: { id, tutorId: session.user.id },
    data: {
      ...fields,
      topicId: await resolveAllowedTopicId(fields.topicId, session.user.id),
    },
  });
  if (updated.count === 0) return { error: "Задача не найдена." };

  revalidatePath("/tutor/tasks");
  revalidatePath(`/tutor/tasks/${id}`);
  return { ok: true };
}

export async function deleteTask(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const id = String(formData.get("id") ?? "");
  await prisma.task.deleteMany({ where: { id, tutorId: session.user.id } });
  redirect("/tutor/tasks");
}

// ---------- Импорт JSON ----------

export type ImportReport = {
  error?: string;
  ok?: boolean;
  created?: number;
  problems?: string[];
};

type RawTask = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Импорт массива задач из JSON (формат: см. экспорт). */
export async function importTasksJson(
  _prev: ImportReport,
  formData: FormData,
): Promise<ImportReport> {
  const session = await requireTutor();
  const tutorId = session.user.id;

  const limit = await consumeRateLimit(`import:${tutorId}`, { windowSec: 3600, max: 10 });
  if (!limit.allowed) {
    return { error: `Слишком много импортов за час. ${retryHint(limit.retryAfterSec)}` };
  }

  // JSON приходит либо файлом, либо текстом из textarea.
  let raw = String(formData.get("json") ?? "").trim();
  const file = formData.get("file");
  if (!raw && file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) {
      return { error: "Файл больше 2 МБ. Разбейте импорт на части." };
    }
    raw = await file.text();
  }
  if (!raw) return { error: "Вставьте JSON или выберите файл." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Не получилось разобрать JSON — проверьте синтаксис." };
  }
  const list = Array.isArray(parsed) ? (parsed as RawTask[]) : null;
  if (!list) return { error: "Ожидается массив задач: [ { ... }, { ... } ]." };
  if (list.length === 0) return { error: "Массив пуст." };
  if (list.length > 500) return { error: "За один раз можно импортировать до 500 задач." };

  const problems: string[] = [];
  let created = 0;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const statement = str(item.statement);
    if (!statement) {
      problems.push(`№${i + 1}: пропущена — нет statement`);
      continue;
    }
    const answerType: AnswerType =
      item.answer_type === "DETAILED" ? "DETAILED" : "SHORT";
    const answer = str(item.answer);
    if (answerType === "SHORT" && !answer) {
      problems.push(`№${i + 1}: пропущена — SHORT без answer`);
      continue;
    }
    const difficultyNum = Number(item.difficulty);
    const difficulty =
      Number.isInteger(difficultyNum) && difficultyNum >= 1 && difficultyNum <= 5
        ? difficultyNum
        : 3;
    const tags = Array.isArray(item.tags)
      ? item.tags.filter((t): t is string => typeof t === "string").slice(0, 20)
      : [];

    // topic_code → тема (кодификатор или своя; своя создаётся при необходимости)
    let topicId: string | null = null;
    const code = str(item.topic_code);
    if (code) {
      const ref = parseTopicCode(code);
      if (!ref) {
        problems.push(`№${i + 1}: тема «${code}» не распознана, задача без темы`);
      } else if ("customTitle" in ref) {
        const topic =
          (await prisma.topic.findFirst({
            where: { tutorId, title: ref.customTitle },
          })) ??
          (await prisma.topic.create({
            data: { title: ref.customTitle, tutorId },
          }));
        topicId = topic.id;
      } else {
        const topic = await prisma.topic.findFirst({
          where: { exam: ref.exam, kimNumber: ref.kimNumber, tutorId: null },
        });
        if (topic) topicId = topic.id;
        else problems.push(`№${i + 1}: тема «${code}» не найдена, задача без темы`);
      }
    }

    await prisma.task.create({
      data: {
        statement,
        answerType,
        answer,
        solution: str(item.solution),
        difficulty,
        source: str(item.source),
        tags,
        topicId,
        tutorId,
      },
    });
    created++;
  }

  revalidatePath("/tutor/tasks");
  return { ok: true, created, problems };
}
