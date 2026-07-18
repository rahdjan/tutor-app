import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { LessonForm, LessonRow } from "./lesson-forms";

export const metadata: Metadata = { title: "Уроки" };

export default async function LessonsPage({
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

  const lessons = await prisma.lesson.findMany({
    where: { studentId: student.id },
    orderBy: { scheduledAt: "desc" },
  });
  const now = new Date();
  const upcoming = lessons.filter((l) => l.scheduledAt >= now).reverse();
  const past = lessons.filter((l) => l.scheduledAt < now);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <Link
        href={`/tutor/students/${student.id}`}
        className="text-sm font-semibold underline"
      >
        ← К карточке ученика
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Уроки · {student.name}
      </h1>

      <section className="window-card mb-6 p-6">
        <p className="eyebrow mb-4 text-muted">• Новый урок</p>
        <LessonForm studentId={student.id} />
      </section>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <p className="eyebrow mb-3 text-muted">• Предстоящие ({upcoming.length})</p>
          <ul className="space-y-3">
            {upcoming.map((l) => (
              <LessonRow
                key={l.id}
                lesson={{
                  id: l.id,
                  scheduledAt: l.scheduledAt.toISOString(),
                  durationMin: l.durationMin,
                  note: l.note,
                }}
              />
            ))}
          </ul>
        </section>
      )}

      <section>
        <p className="eyebrow mb-3 text-muted">• Прошедшие ({past.length})</p>
        {past.length === 0 ? (
          <p className="text-sm text-muted">Пока не было ни одного урока.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((l) => (
              <LessonRow
                key={l.id}
                lesson={{
                  id: l.id,
                  scheduledAt: l.scheduledAt.toISOString(),
                  durationMin: l.durationMin,
                  note: l.note,
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
