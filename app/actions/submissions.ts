"use server";

// Actions прохождения заданий (ученик) и проверки (репетитор).
// Изоляция: ученик — только свои задания (через карточку по userId),
// репетитор — только работы своих учеников (через tutorId).
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireTutor } from "@/lib/access";
import { checkShortAnswer } from "@/lib/answers";
import type { FormState } from "@/app/actions/auth";

export type AnswerState = {
  error?: string;
  saved?: boolean;
  /** true/false — мгновенный результат SHORT; null — DETAILED (ждёт репетитора) */
  correct?: boolean | null;
};

/** Задание текущего ученика (или null). */
async function ownAssignment(assignmentId: string, userId: string) {
  const card = await prisma.student.findUnique({ where: { userId } });
  if (!card) return null;
  return prisma.assignment.findFirst({
    where: { id: assignmentId, studentId: card.id },
  });
}

/** Ученик отвечает на одну задачу: SHORT — мгновенная автопроверка. */
export async function saveAnswer(
  _prev: AnswerState,
  formData: FormData,
): Promise<AnswerState> {
  const session = await requireStudent();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const answerText = String(formData.get("answerText") ?? "").trim();
  const photo = formData.get("photo");

  const assignment = await ownAssignment(assignmentId, session.user.id);
  if (!assignment) return { error: "Задание не найдено." };

  // Задача должна входить в этот лист
  const wt = await prisma.worksheetTask.findFirst({
    where: { worksheetId: assignment.worksheetId, taskId },
    include: { task: { select: { answerType: true, answer: true } } },
  });
  if (!wt) return { error: "Задача не найдена в этом задании." };

  // Черновик работы (создаётся при первом ответе)
  const submission =
    (await prisma.submission.findFirst({ where: { assignmentId } })) ??
    (await prisma.submission.create({ data: { assignmentId } }));
  if (submission.submittedAt) {
    return { error: "Работа уже сдана — изменить ответы нельзя." };
  }

  // Фото решения (для развёрнутых): в облачное хранилище, в БД — только ссылка
  let fileUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { error: "Загрузка фото пока не настроена. Отправьте решение текстом." };
    }
    if (photo.size > 8 * 1024 * 1024) {
      return { error: "Фото больше 8 МБ. Сфотографируйте с меньшим качеством." };
    }
    if (!photo.type.startsWith("image/")) {
      return { error: "Можно загрузить только изображение." };
    }
    const ext = photo.type.split("/")[1] ?? "jpg";
    const blob = await put(
      `solutions/${assignment.id}/${taskId}-${Date.now()}.${ext}`,
      photo,
      { access: "public" },
    );
    fileUrl = blob.url;
  }

  if (!answerText && !fileUrl) {
    return { error: "Введите ответ или прикрепите фото решения." };
  }

  // Автопроверка коротких — сразу
  const isShort = wt.task.answerType === "SHORT";
  const autoScore = isShort
    ? checkShortAnswer(answerText, wt.task.answer ?? "")
      ? 1
      : 0
    : null;

  await prisma.answerEntry.upsert({
    where: {
      submissionId_taskId: { submissionId: submission.id, taskId },
    },
    create: {
      submissionId: submission.id,
      taskId,
      answerText: answerText || null,
      fileUrl,
      autoScore,
    },
    update: {
      answerText: answerText || null,
      ...(fileUrl ? { fileUrl } : {}),
      autoScore,
    },
  });

  revalidatePath(`/student/assignments/${assignmentId}`);
  return { saved: true, correct: isShort ? autoScore === 1 : null };
}

/** Ученик сдаёт работу целиком — ответы фиксируются. */
export async function finishSubmission(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireStudent();
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const assignment = await ownAssignment(assignmentId, session.user.id);
  if (!assignment) return { error: "Задание не найдено." };

  const submission = await prisma.submission.findFirst({
    where: { assignmentId },
    include: { _count: { select: { entries: true } } },
  });
  if (!submission || submission._count.entries === 0) {
    return { error: "Сначала ответьте хотя бы на одну задачу." };
  }
  if (submission.submittedAt) return { error: "Работа уже сдана." };

  await prisma.submission.update({
    where: { id: submission.id },
    data: { submittedAt: new Date() },
  });

  revalidatePath(`/student/assignments/${assignmentId}`);
  return { ok: true };
}

/** Репетитор ставит балл и комментарий за задачу. */
export async function gradeEntry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const entryId = String(formData.get("entryId") ?? "");
  const scoreRaw = String(formData.get("manualScore") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const score = scoreRaw === "" ? null : Number(scoreRaw);
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 99)) {
    return { error: "Балл — целое число от 0 до 99." };
  }

  // Изоляция: запись должна принадлежать работе ученика этого репетитора
  const entry = await prisma.answerEntry.findFirst({
    where: {
      id: entryId,
      submission: { assignment: { tutorId: session.user.id } },
    },
    include: { submission: { select: { assignmentId: true } } },
  });
  if (!entry) return { error: "Ответ не найден." };

  await prisma.answerEntry.update({
    where: { id: entry.id },
    data: { manualScore: score, comment },
  });

  revalidatePath(`/tutor/review/${entry.submissionId}`);
  revalidatePath("/tutor/review");
  return { ok: true };
}
