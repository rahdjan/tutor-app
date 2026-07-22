"use server";

// Server actions карточек учеников. Каждый запрос фильтруется по tutorId
// текущего репетитора — чужую карточку нельзя ни увидеть, ни изменить.
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import { consumeRateLimit, retryHint } from "@/lib/rate-limit";
import type { Goal } from "@/app/generated/prisma/enums";
import { GOALS_BY_SUBJECT } from "@/lib/labels";
import { resolveSubject } from "@/lib/topic-visibility";
import type { FormState } from "@/app/actions/auth";

function readStudentFields(formData: FormData, subject: ReturnType<typeof resolveSubject>) {
  const name = String(formData.get("name") ?? "").trim();
  const gradeRaw = String(formData.get("grade") ?? "").trim();
  const grade = gradeRaw ? Number(gradeRaw) : null;
  const goalRaw = String(formData.get("goal") ?? "OTHER");
  const allowedGoals = GOALS_BY_SUBJECT[subject] as string[];
  const goal = allowedGoals.includes(goalRaw) ? (goalRaw as Goal) : "OTHER";
  const examDateRaw = String(formData.get("examDate") ?? "").trim();
  const examDate = examDateRaw ? new Date(examDateRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const boardUrl = String(formData.get("boardUrl") ?? "").trim() || null;
  return { name, grade, goal, examDate, notes, boardUrl };
}

/** Добавление карточки ученика. */
export async function createStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const fields = readStudentFields(formData, resolveSubject(session.user));
  if (!fields.name) return { error: "Укажите имя или метку ученика." };
  if (fields.grade !== null && (fields.grade < 1 || fields.grade > 11)) {
    return { error: "Класс — число от 1 до 11." };
  }
  if (fields.boardUrl && !/^https?:\/\//.test(fields.boardUrl)) {
    return { error: "Ссылка на доску должна начинаться с http:// или https://" };
  }

  const student = await prisma.student.create({
    data: { ...fields, tutorId: session.user.id },
  });
  redirect(`/tutor/students/${student.id}`);
}

/** Редактирование карточки. */
export async function updateStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const id = String(formData.get("id") ?? "");
  const fields = readStudentFields(formData, resolveSubject(session.user));
  if (!fields.name) return { error: "Укажите имя или метку ученика." };
  if (fields.grade !== null && (fields.grade < 1 || fields.grade > 11)) {
    return { error: "Класс — число от 1 до 11." };
  }
  if (fields.boardUrl && !/^https?:\/\//.test(fields.boardUrl)) {
    return { error: "Ссылка на доску должна начинаться с http:// или https://" };
  }

  // updateMany с фильтром по tutorId: чужая карточка просто не найдётся.
  const updated = await prisma.student.updateMany({
    where: { id, tutorId: session.user.id },
    data: fields,
  });
  if (updated.count === 0) return { error: "Карточка не найдена." };

  revalidatePath(`/tutor/students/${id}`);
  revalidatePath("/tutor");
  return { ok: true };
}

/** Создать ссылку-приглашение для конкретной карточки (действует 14 дней). */
export async function createStudentInvite(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const studentId = String(formData.get("studentId") ?? "");

  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!student) return { error: "Карточка не найдена." };
  if (student.userId) return { error: "У ученика уже есть аккаунт." };

  const limit = await consumeRateLimit(`invite:${session.user.id}`, {
    windowSec: 3600,
    max: 30,
  });
  if (!limit.allowed) {
    return { error: `Слишком много приглашений за час. ${retryHint(limit.retryAfterSec)}` };
  }

  // Старые неиспользованные приглашения карточки гасим — активна одна ссылка.
  await prisma.invite.updateMany({
    where: { studentId, usedAt: null },
    data: { expiresAt: new Date() },
  });

  await prisma.invite.create({
    data: {
      code: randomBytes(9).toString("base64url"),
      label: student.name,
      tutorId: session.user.id,
      studentId,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath(`/tutor/students/${studentId}`);
  return { ok: true };
}
