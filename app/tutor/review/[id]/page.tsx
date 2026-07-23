import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { MathText } from "@/components/math-text";
import { effectiveScore } from "@/lib/answers";
import { GradeForm } from "./grade-form";

export const metadata: Metadata = { title: "Проверка работы" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  // Изоляция: работа должна принадлежать ученику этого репетитора.
  const submission = await prisma.submission.findFirst({
    where: { id, assignment: { tutorId: session.user.id } },
    include: {
      assignment: {
        include: {
          student: { select: { name: true } },
          worksheet: {
            include: {
              tasks: { include: { task: true }, orderBy: { order: "asc" } },
            },
          },
        },
      },
      entries: true,
    },
  });
  if (!submission) notFound();

  const entryByTask = new Map(submission.entries.map((e) => [e.taskId, e]));

  // Считаем короткие и развёрнутые раздельно (как раньше), но балл каждой
  // записи — через effectiveScore, иначе переопределённый короткий ответ
  // задвоился бы (и как autoScore, и как manualScore).
  let shortCorrect = 0;
  let shortTotal = 0;
  let detailedPoints = 0;
  let detailedGraded = 0;
  let detailedTotal = 0;
  for (const wt of submission.assignment.worksheet.tasks) {
    const entry = entryByTask.get(wt.taskId);
    if (wt.task.answerType === "SHORT") {
      shortTotal++;
      if (entry && effectiveScore(entry) === 1) shortCorrect++;
    } else {
      detailedTotal++;
      if (entry?.manualScore !== null && entry?.manualScore !== undefined) {
        detailedGraded++;
        detailedPoints += entry.manualScore;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />

      <Link href="/tutor/review" className="text-sm font-semibold underline">
        ← Ко всем работам
      </Link>
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        {submission.assignment.student.name} ·{" "}
        {submission.assignment.worksheet.title}
      </h1>
      <p className="mb-6 text-sm text-muted">
        Сдано{" "}
        {submission.submittedAt
          ? submission.submittedAt.toLocaleString("ru-RU", {
              dateStyle: "long",
              timeStyle: "short",
            })
          : "— ещё в работе"}{" "}
        · Короткие: {shortCorrect}/{shortTotal} · Развёрнутые: {detailedPoints} б. за{" "}
        {detailedGraded}/{detailedTotal}
      </p>

      <ol className="space-y-6">
        {submission.assignment.worksheet.tasks.map((wt, i) => {
          const entry = entryByTask.get(wt.taskId);
          const isShort = wt.task.answerType === "SHORT";
          return (
            <li key={wt.id} className="window-card p-5">
              <div className="mb-2 flex gap-3">
                <span className="text-lg font-bold">{i + 1}.</span>
                <MathText text={wt.task.statement} className="flex-1" />
              </div>

              <div className="space-y-2 pl-8 text-sm">
                {isShort && (
                  <p className="text-muted">
                    Эталонный ответ: <b className="text-ink">{wt.task.answer}</b>
                  </p>
                )}
                {wt.task.solution && (
                  <details className="text-muted">
                    <summary className="cursor-pointer">Ваше решение (из банка)</summary>
                    <MathText text={wt.task.solution} className="mt-1 text-ink" />
                  </details>
                )}

                {!entry ? (
                  <p className="text-muted">Ученик не отвечал на эту задачу.</p>
                ) : (
                  <>
                    {entry.answerText && (
                      <p>
                        Ответ ученика: <b>{entry.answerText}</b>
                      </p>
                    )}
                    {entry.fileUrl && (
                      <div>
                        <a href={`/api/solution-photo/${entry.id}`} target="_blank" className="underline">
                          📷 Открыть фото решения
                        </a>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/solution-photo/${entry.id}`}
                          alt="Фото решения ученика"
                          className="mt-2 max-h-96 rounded-lg border-[1.5px] border-ink/20"
                        />
                      </div>
                    )}
                    {isShort ? (
                      <div className="space-y-2">
                        <p
                          className={
                            entry.autoScore === 1
                              ? "font-semibold text-[#4d7a3a]"
                              : "font-semibold text-[#8f3a25]"
                          }
                        >
                          Автопроверка: {entry.autoScore === 1 ? "верно ✓" : "неверно ✗"}
                        </p>
                        {entry.manualScore !== null &&
                          entry.manualScore !== entry.autoScore && (
                            <p className="font-semibold text-[#8f6a25]">
                              Переопределено вручную:{" "}
                              {entry.manualScore === 1 ? "верно ✓" : "неверно ✗"}
                            </p>
                          )}
                        <GradeForm
                          entryId={entry.id}
                          initialScore={entry.manualScore}
                          initialComment={entry.comment}
                          mode="binary"
                        />
                      </div>
                    ) : (
                      <GradeForm
                        entryId={entry.id}
                        initialScore={entry.manualScore}
                        initialComment={entry.comment}
                      />
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
