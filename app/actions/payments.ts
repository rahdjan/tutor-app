"use server";

// Server actions оплат. Изоляция: оплата всегда у карточки текущего репетитора.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";
import type { FormState } from "@/app/actions/auth";

export async function createPayment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const studentId = String(formData.get("studentId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim().replace(",", ".");
  const amount = Number(amountRaw);
  const lessonsCount = Number(formData.get("lessonsCount") ?? 1);
  const dateRaw = String(formData.get("paidAt") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    return { error: "Сумма — число от 0 до 1 000 000." };
  }
  if (!Number.isInteger(lessonsCount) || lessonsCount < 1 || lessonsCount > 100) {
    return { error: "Количество уроков — целое число от 1 до 100." };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!student) return { error: "Карточка не найдена." };

  await prisma.payment.create({
    data: {
      studentId,
      tutorId: session.user.id,
      amount: amountRaw || "0",
      lessonsCount,
      paidAt: dateRaw ? new Date(dateRaw) : new Date(),
      note,
    },
  });
  revalidatePath(`/tutor/students/${studentId}/payments`);
  return { ok: true };
}

export async function deletePayment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tutorId: session.user.id },
  });
  if (!payment) return { error: "Оплата не найдена." };

  await prisma.payment.delete({ where: { id: payment.id } });
  revalidatePath(`/tutor/students/${payment.studentId}/payments`);
  return {};
}
