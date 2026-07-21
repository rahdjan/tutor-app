import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";

export const metadata: Metadata = { title: "Проверка работ" };

export default async function ReviewListPage() {
  const session = await requireTutor();

  // Изоляция: только сданные работы учеников этого репетитора.
  const submissions = await prisma.submission.findMany({
    where: {
      submittedAt: { not: null },
      assignment: { tutorId: session.user.id },
    },
    include: {
      assignment: {
        include: {
          student: { select: { name: true } },
          worksheet: { select: { title: true } },
        },
      },
      entries: {
        include: { task: { select: { answerType: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const withStatus = submissions.map((s) => {
    const detailed = s.entries.filter((e) => e.task.answerType === "DETAILED");
    const ungraded = detailed.filter((e) => e.manualScore === null).length;
    const autoPoints = s.entries.reduce((sum, e) => sum + (e.autoScore ?? 0), 0);
    const manualPoints = s.entries.reduce((sum, e) => sum + (e.manualScore ?? 0), 0);
    return { s, ungraded, needsReview: ungraded > 0, autoPoints, manualPoints };
  });
  const pending = withStatus.filter((x) => x.needsReview);
  const done = withStatus.filter((x) => !x.needsReview);

  const Row = ({
    item,
  }: {
    item: (typeof withStatus)[number];
  }) => (
    <li>
      <Link
        href={`/tutor/review/${item.s.id}`}
        className="window-card block p-4 transition-transform hover:-translate-y-0.5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-bold">
            {item.s.assignment.student.name} ·{" "}
            <span className="font-normal">{item.s.assignment.worksheet.title}</span>
          </p>
          {item.needsReview ? (
            <span className="text-sm font-semibold text-[#8f6a25]">
              ждёт проверки: {item.ungraded}
            </span>
          ) : (
            <span className="text-sm text-[#4d7a3a]">
              проверено ✓ · {item.autoPoints + item.manualPoints} баллов
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          сдано {item.s.submittedAt!.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
        </p>
      </Link>
    </li>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />

      <h1 className="mt-4 mb-8 text-3xl font-extrabold tracking-tight">
        Проверка работ
      </h1>

      {submissions.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-1 font-semibold">Сданных работ пока нет</p>
          <p className="text-sm text-muted">
            Когда ученик сдаст задание, оно появится здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <p className="eyebrow mb-3 text-muted">
                • Требуют проверки ({pending.length})
              </p>
              <ul className="space-y-3">
                {pending.map((x) => (
                  <Row key={x.s.id} item={x} />
                ))}
              </ul>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <p className="eyebrow mb-3 text-muted">
                • Проверенные ({done.length})
              </p>
              <ul className="space-y-3">
                {done.map((x) => (
                  <Row key={x.s.id} item={x} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
