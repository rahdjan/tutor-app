// Баланс пакетов занятий.
// Куплено = сумма lessonsCount по оплатам; израсходовано = проведённые уроки.
// Отрицательный баланс — долг (уроки прошли, оплаты не хватило).
import { prisma } from "@/lib/prisma";

export type StudentBalance = {
  purchased: number;
  done: number;
  balance: number;
};

/** Баланс одного ученика. */
export async function studentBalance(studentId: string): Promise<StudentBalance> {
  const [paid, done] = await Promise.all([
    prisma.payment.aggregate({
      where: { studentId },
      _sum: { lessonsCount: true },
    }),
    prisma.lesson.count({ where: { studentId, status: "DONE" } }),
  ]);
  const purchased = paid._sum.lessonsCount ?? 0;
  return { purchased, done, balance: purchased - done };
}

/** Балансы всех учеников репетитора одним махом (для «Сегодня»). */
export async function tutorBalances(
  tutorId: string,
): Promise<Map<string, StudentBalance>> {
  const [paidGroups, doneGroups, students] = await Promise.all([
    prisma.payment.groupBy({
      by: ["studentId"],
      where: { tutorId },
      _sum: { lessonsCount: true },
    }),
    prisma.lesson.groupBy({
      by: ["studentId"],
      where: { tutorId, status: "DONE" },
      _count: true,
    }),
    prisma.student.findMany({ where: { tutorId }, select: { id: true } }),
  ]);
  const paidBy = new Map(paidGroups.map((g) => [g.studentId, g._sum.lessonsCount ?? 0]));
  const doneBy = new Map(doneGroups.map((g) => [g.studentId, g._count]));
  const result = new Map<string, StudentBalance>();
  for (const s of students) {
    const purchased = paidBy.get(s.id) ?? 0;
    const done = doneBy.get(s.id) ?? 0;
    result.set(s.id, { purchased, done, balance: purchased - done });
  }
  return result;
}
