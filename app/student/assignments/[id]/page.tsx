import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { MathText } from "@/components/math-text";
import { TaskAnswer } from "./task-answer";
import { FinishForm } from "./finish-form";

export const metadata: Metadata = { title: "Задание" };

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStudent();
  const { id } = await params;

  // Изоляция: задание должно принадлежать карточке этого ученика.
  const card = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });
  if (!card) notFound();

  const assignment = await prisma.assignment.findFirst({
    where: { id, studentId: card.id },
    include: {
      worksheet: {
        include: {
          tasks: { include: { task: true }, orderBy: { order: "asc" } },
        },
      },
      submissions: { include: { entries: true } },
    },
  });
  if (!assignment) notFound();

  const submission = assignment.submissions[0];
  const submitted = Boolean(submission?.submittedAt);
  const entryByTask = new Map(
    (submission?.entries ?? []).map((e) => [e.taskId, e]),
  );

  const autoPoints = (submission?.entries ?? []).reduce(
    (s, e) => s + (e.autoScore ?? 0),
    0,
  );
  const manualPoints = (submission?.entries ?? []).reduce(
    (s, e) => s + (e.manualScore ?? 0),
    0,
  );
  const graded = (submission?.entries ?? []).some((e) => e.manualScore !== null);
  const shortTotal = assignment.worksheet.tasks.filter(
    (t) => t.task.answerType === "SHORT",
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <Link href="/student" className="text-sm font-semibold underline">
        ← К списку заданий
      </Link>
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        {assignment.worksheet.title}
      </h1>
      <p className="mb-6 text-sm text-muted">
        {assignment.dueAt
          ? `Сдать до ${assignment.dueAt.toLocaleDateString("ru-RU")} · `
          : ""}
        Короткие ответы проверяются сразу, развёрнутые смотрит репетитор.
      </p>

      {submitted && (
        <div className="mb-6 rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-4 py-3 text-sm">
          <p className="font-semibold text-[#40662f]">
            Работа сдана{" "}
            {submission!.submittedAt!.toLocaleDateString("ru-RU")} ✓
          </p>
          <p className="mt-1 text-[#40662f]">
            Автопроверка: {autoPoints} из {shortTotal}
            {graded
              ? ` · Баллы репетитора: ${manualPoints}`
              : " · Развёрнутые ответы ждут проверки репетитора"}
          </p>
        </div>
      )}

      <ol className="space-y-6">
        {assignment.worksheet.tasks.map((wt, i) => {
          const entry = entryByTask.get(wt.taskId);
          return (
            <li key={wt.id} className="window-card p-5">
              <div className="mb-3 flex gap-3">
                <span className="text-lg font-bold">{i + 1}.</span>
                <MathText text={wt.task.statement} className="flex-1" />
              </div>

              <TaskAnswer
                assignmentId={assignment.id}
                taskId={wt.taskId}
                answerType={wt.task.answerType}
                submitted={submitted}
                entry={
                  entry
                    ? {
                        answerText: entry.answerText,
                        fileUrl: entry.fileUrl,
                        autoScore: entry.autoScore,
                        manualScore: entry.manualScore,
                        comment: entry.comment,
                      }
                    : null
                }
              />
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="mt-8">
          <FinishForm assignmentId={assignment.id} />
        </div>
      )}
    </div>
  );
}
