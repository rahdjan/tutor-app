import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { EXAM_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Статистика ученика" };

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  // Изоляция: карточка только своя.
  const student = await prisma.student.findFirst({
    where: { id, tutorId: session.user.id },
  });
  if (!student) notFound();

  // Все ответы из сданных работ ученика
  const entries = await prisma.answerEntry.findMany({
    where: {
      submission: {
        submittedAt: { not: null },
        assignment: { studentId: student.id },
      },
    },
    include: {
      task: {
        select: {
          answerType: true,
          topic: { select: { id: true, title: true, exam: true, kimNumber: true } },
        },
      },
      submission: {
        select: {
          submittedAt: true,
          assignment: {
            select: { worksheet: { select: { title: true } } },
          },
        },
      },
    },
  });

  // --- Решаемость по темам ---
  type TopicStat = {
    label: string;
    shortTotal: number;
    shortCorrect: number;
    detailedCount: number;
    detailedPoints: number;
  };
  const byTopic = new Map<string, TopicStat>();
  for (const e of entries) {
    const t = e.task.topic;
    const key = t ? t.id : "none";
    const label = t
      ? t.exam
        ? `${EXAM_LABELS[t.exam]} №${t.kimNumber} · ${t.title}`
        : t.title
      : "Без темы";
    const stat =
      byTopic.get(key) ??
      { label, shortTotal: 0, shortCorrect: 0, detailedCount: 0, detailedPoints: 0 };
    if (e.task.answerType === "SHORT") {
      stat.shortTotal += 1;
      if (e.autoScore === 1) stat.shortCorrect += 1;
    } else {
      stat.detailedCount += 1;
      stat.detailedPoints += e.manualScore ?? 0;
    }
    byTopic.set(key, stat);
  }
  const topicStats = [...byTopic.values()].map((s) => ({
    ...s,
    rate: s.shortTotal > 0 ? Math.round((s.shortCorrect / s.shortTotal) * 100) : null,
  }));
  topicStats.sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  // Западающие: решаемость < 60% при ≥ 2 попытках
  const weak = topicStats.filter(
    (s) => s.rate !== null && s.shortTotal >= 2 && s.rate < 60,
  );

  // --- Динамика по работам ---
  type WorkStat = {
    date: Date;
    title: string;
    shortTotal: number;
    shortCorrect: number;
    manualPoints: number;
  };
  const byWork = new Map<string, WorkStat>();
  for (const e of entries) {
    const key = e.submissionId;
    const stat =
      byWork.get(key) ??
      {
        date: e.submission.submittedAt!,
        title: e.submission.assignment.worksheet.title,
        shortTotal: 0,
        shortCorrect: 0,
        manualPoints: 0,
      };
    if (e.task.answerType === "SHORT") {
      stat.shortTotal += 1;
      if (e.autoScore === 1) stat.shortCorrect += 1;
    } else {
      stat.manualPoints += e.manualScore ?? 0;
    }
    byWork.set(key, stat);
  }
  const works = [...byWork.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const Bar = ({ pct }: { pct: number }) => (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/40 bg-paper">
      <div
        className={`h-full ${pct < 60 ? "bg-[#e0654a]" : pct < 85 ? "bg-butter" : "bg-[#7a9e63]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />

      <Link
        href={`/tutor/students/${student.id}`}
        className="text-sm font-semibold underline"
      >
        ← К карточке ученика
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Статистика · {student.name}
      </h1>

      {entries.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-1 font-semibold">Данных пока нет</p>
          <p className="text-sm text-muted">
            Статистика появится, когда ученик сдаст первую работу.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {weak.length > 0 && (
            <section className="window-card border-[#b3492f] p-6">
              <p className="eyebrow mb-3 text-[#8f3a25]">
                ⚠ Западающие темы (решаемость ниже 60%)
              </p>
              <ul className="space-y-2">
                {weak.map((s) => (
                  <li key={s.label} className="text-sm">
                    <span className="font-semibold">{s.label}</span>{" "}
                    <span className="text-muted">
                      — {s.shortCorrect} из {s.shortTotal} ({s.rate}%)
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Решаемость по темам</p>
            <ul className="space-y-3">
              {topicStats.map((s) => (
                <li key={s.label} className="text-sm">
                  <div className="mb-1 flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-muted">
                      {s.rate !== null
                        ? `краткие: ${s.shortCorrect}/${s.shortTotal} (${s.rate}%)`
                        : ""}
                      {s.detailedCount > 0
                        ? `${s.rate !== null ? " · " : ""}развёрнутые: ${s.detailedPoints} б. за ${s.detailedCount}`
                        : ""}
                    </span>
                  </div>
                  {s.rate !== null && <Bar pct={s.rate} />}
                </li>
              ))}
            </ul>
          </section>

          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Динамика по работам</p>
            <ul className="space-y-3">
              {works.map((w, i) => {
                const pct =
                  w.shortTotal > 0
                    ? Math.round((w.shortCorrect / w.shortTotal) * 100)
                    : null;
                return (
                  <li key={i} className="text-sm">
                    <div className="mb-1 flex flex-wrap justify-between gap-2">
                      <span>
                        <span className="text-muted">
                          {w.date.toLocaleDateString("ru-RU")}
                        </span>{" "}
                        <span className="font-semibold">{w.title}</span>
                      </span>
                      <span className="text-muted">
                        {pct !== null ? `${w.shortCorrect}/${w.shortTotal} (${pct}%)` : ""}
                        {w.manualPoints > 0
                          ? `${pct !== null ? " · " : ""}+${w.manualPoints} б. за развёрнутые`
                          : ""}
                      </span>
                    </div>
                    {pct !== null && <Bar pct={pct} />}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
