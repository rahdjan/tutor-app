import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { tutorBalances } from "@/lib/balance";
import { DashboardHeader } from "@/components/dashboard-header";
import { CopyButton } from "@/components/copy-button";
import { LESSON_STATUS_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Расписание" };

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Пн = 0
  d.setDate(d.getDate() - day);
  return d;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/** Текст напоминания для отправки ученику/родителю. */
function reminderText(studentName: string, lesson: { scheduledAt: Date; durationMin: number }, boardUrl: string | null): string {
  const date = lesson.scheduledAt.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  let text = `${studentName}, напоминаю про занятие: ${date} в ${fmtTime(lesson.scheduledAt)}, ${lesson.durationMin} мин.`;
  if (boardUrl) text += ` Наша доска: ${boardUrl}`;
  return text;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireTutor();
  const tutorId = session.user.id;
  const sp = await searchParams;
  const offset = Number(typeof sp.week === "string" ? sp.week : 0) || 0;

  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + offset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Изоляция: только свои уроки и ученики.
  const [lessons, balances, students] = await Promise.all([
    prisma.lesson.findMany({
      where: { tutorId, scheduledAt: { gte: weekStart, lt: weekEnd } },
      include: { student: { select: { id: true, name: true, boardUrl: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    tutorBalances(tutorId),
    prisma.student.findMany({
      where: { tutorId },
      select: { id: true, name: true },
    }),
  ]);

  const nameById = new Map(students.map((s) => [s.id, s.name]));
  const lowPacks = [...balances.entries()].filter(
    ([, b]) => b.purchased > 0 && b.balance >= 0 && b.balance <= 1,
  );
  const debts = [...balances.entries()].filter(([, b]) => b.balance < 0);

  const today = new Date();
  const isCurrentWeek = offset === 0;
  const todayLessons = lessons.filter(
    (l) =>
      l.scheduledAt.toDateString() === today.toDateString() &&
      l.status !== "CANCELLED",
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      date,
      lessons: lessons.filter(
        (l) => l.scheduledAt.toDateString() === date.toDateString(),
      ),
    };
  });

  const weekLabel = `${weekStart.toLocaleDateString("ru-RU")} — ${new Date(weekEnd.getTime() - 1).toLocaleDateString("ru-RU")}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Расписание</h1>
        <div className="flex items-center gap-2">
          <Link href={`/tutor/schedule?week=${offset - 1}`} className="btn-pill bg-paper px-3 py-1.5 text-sm">
            ← пред.
          </Link>
          <span className="text-sm font-semibold">{weekLabel}</span>
          <Link href={`/tutor/schedule?week=${offset + 1}`} className="btn-pill bg-paper px-3 py-1.5 text-sm">
            след. →
          </Link>
          {offset !== 0 && (
            <Link href="/tutor/schedule" className="btn-pill bg-butter px-3 py-1.5 text-sm">
              Сегодня
            </Link>
          )}
        </div>
      </div>

      {/* Сегодня */}
      {isCurrentWeek && (
        <section className="window-card mb-8 p-6">
          <p className="eyebrow mb-4 text-muted">
            • Сегодня,{" "}
            {today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-bold">Занятия</p>
              {todayLessons.length === 0 ? (
                <p className="text-sm text-muted">Сегодня занятий нет.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {todayLessons.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-2">
                      <b>{fmtTime(l.scheduledAt)}</b> {l.student.name}
                      <CopyButton
                        text={reminderText(l.student.name, l, l.student.boardUrl)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Пакеты кончаются</p>
              {lowPacks.length === 0 ? (
                <p className="text-sm text-muted">Таких нет.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {lowPacks.map(([sid, b]) => (
                    <li key={sid}>
                      <Link href={`/tutor/students/${sid}/payments`} className="underline">
                        {nameById.get(sid)}
                      </Link>{" "}
                      <span className="text-[#8f6a25]">осталось {b.balance}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Долги</p>
              {debts.length === 0 ? (
                <p className="text-sm text-muted">Долгов нет 🎉</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {debts.map(([sid, b]) => (
                    <li key={sid}>
                      <Link href={`/tutor/students/${sid}/payments`} className="underline">
                        {nameById.get(sid)}
                      </Link>{" "}
                      <span className="font-semibold text-[#8f3a25]">
                        {b.balance} ур.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Неделя */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, i) => {
          const isToday = day.date.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className={`window-card p-3 ${isToday ? "border-2 border-butter" : ""}`}
            >
              <p className="mb-2 text-sm font-bold">
                {DAY_NAMES[i]}{" "}
                <span className="font-normal text-muted">
                  {day.date.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "numeric",
                  })}
                </span>
              </p>
              {day.lessons.length === 0 ? (
                <p className="text-xs text-muted">—</p>
              ) : (
                <ul className="space-y-2">
                  {day.lessons.map((l) => (
                    <li
                      key={l.id}
                      className={`rounded-lg border-[1.5px] px-2 py-1.5 text-xs ${
                        l.status === "CANCELLED"
                          ? "border-ink/20 opacity-50 line-through"
                          : l.status === "DONE"
                            ? "border-[#7a9e63] bg-[#eef5e9]"
                            : "border-ink/30"
                      }`}
                    >
                      <Link
                        href={`/tutor/students/${l.student.id}/lessons`}
                        className="font-semibold hover:underline"
                      >
                        {fmtTime(l.scheduledAt)} {l.student.name}
                      </Link>
                      <p className="text-muted">
                        {l.durationMin} мин · {LESSON_STATUS_LABELS[l.status]}
                      </p>
                      {l.note && <p className="text-muted">{l.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
