"use server";

// Server actions уроков. Изоляция: урок всегда привязан к карточке ученика
// текущего репетитора.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import type { FormState } from "@/app/actions/auth";

function readLessonFields(formData: FormData) {
  const dateRaw = String(formData.get("scheduledAt") ?? "").trim();
  const scheduledAt = dateRaw ? new Date(dateRaw) : null;
  const durationRaw = Number(formData.get("durationMin") ?? 60);
  const durationMin =
    Number.isInteger(durationRaw) && durationRaw >= 15 && durationRaw <= 240
      ? durationRaw
      : 60;
  const note = String(formData.get("note") ?? "").trim() || null;
  return { scheduledAt, durationMin, note };
}

async function ownStudent(studentId: string, tutorId: string) {
  return prisma.student.findFirst({ where: { id: studentId, tutorId } });
}

export async function createLesson(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const studentId = String(formData.get("studentId") ?? "");
  const fields = readLessonFields(formData);
  if (!fields.scheduledAt || Number.isNaN(fields.scheduledAt.getTime())) {
    return { error: "Укажите дату и время урока." };
  }
  const student = await ownStudent(studentId, session.user.id);
  if (!student) return { error: "Карточка не найдена." };

  await prisma.lesson.create({
    data: {
      studentId,
      tutorId: session.user.id,
      scheduledAt: fields.scheduledAt,
      durationMin: fields.durationMin,
      note: fields.note,
    },
  });
  revalidatePath(`/tutor/students/${studentId}/lessons`);
  return { ok: true };
}

export async function updateLesson(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const lessonId = String(formData.get("lessonId") ?? "");
  const fields = readLessonFields(formData);
  if (!fields.scheduledAt || Number.isNaN(fields.scheduledAt.getTime())) {
    return { error: "Укажите дату и время урока." };
  }

  const updated = await prisma.lesson.updateMany({
    where: { id: lessonId, tutorId: session.user.id },
    data: {
      scheduledAt: fields.scheduledAt,
      durationMin: fields.durationMin,
      note: fields.note,
    },
  });
  if (updated.count === 0) return { error: "Урок не найден." };

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (lesson) revalidatePath(`/tutor/students/${lesson.studentId}/lessons`);
  return { ok: true };
}

export async function deleteLesson(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const lessonId = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, tutorId: session.user.id },
  });
  if (!lesson) return { error: "Урок не найден." };

  await prisma.lesson.delete({ where: { id: lesson.id } });
  revalidatePath(`/tutor/students/${lesson.studentId}/lessons`);
  return {};
}
