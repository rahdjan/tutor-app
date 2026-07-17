import type { Metadata } from "next";
import Link from "next/link";
import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";

export const metadata: Metadata = { title: "Кабинет ученика" };

export default async function StudentPage() {
  const session = await requireStudent();

  // Ученик видит только своё: карточка ищется по его userId.
  const card = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      tutor: { select: { name: true } },
      assignments: {
        include: {
          worksheet: {
            select: { title: true, _count: { select: { tasks: true } } },
          },
          submissions: {
            include: {
              entries: {
                select: { autoScore: true, manualScore: true, taskId: true },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        Привет, {session.user.name}!
      </h1>
      {card?.tutor && (
        <p className="mb-8 text-muted">
          Твой репетитор —{" "}
          <span className="font-semibold text-ink">{card.tutor.name}</span>.
        </p>
      )}

      <p className="eyebrow mb-4 text-muted">• Мои задания</p>
      {!card || card.assignments.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-1 font-semibold">Заданий пока нет</p>
          <p className="text-sm text-muted">
            Когда репетитор выдаст тест или рабочий лист, он появится здесь.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {card.assignments.map((a) => {
            const sub = a.submissions[0];
            const total = a.worksheet._count.tasks;
            const answered = sub?.entries.length ?? 0;
            const autoPoints = sub?.entries.reduce(
              (s, e) => s + (e.autoScore ?? 0),
              0,
            );
            const manualPoints = sub?.entries.reduce(
              (s, e) => s + (e.manualScore ?? 0),
              0,
            );
            const graded = sub?.entries.some((e) => e.manualScore !== null);

            let status: string;
            let statusClass = "text-muted";
            if (!sub) {
              status = "не начато";
            } else if (!sub.submittedAt) {
              status = `в работе · отвечено ${answered} из ${total}`;
              statusClass = "text-[#8f6a25]";
            } else if (graded) {
              status = `проверено ✓ · баллы: ${(autoPoints ?? 0) + (manualPoints ?? 0)}`;
              statusClass = "text-[#4d7a3a]";
            } else {
              status = "сдано · ждёт проверки";
              statusClass = "text-[#4d7a3a]";
            }

            return (
              <li key={a.id}>
                <Link
                  href={`/student/assignments/${a.id}`}
                  className="window-card block p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold">{a.worksheet.title}</p>
                    <p className={`text-sm ${statusClass}`}>{status}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    задач: {total}
                    {a.dueAt
                      ? ` · сдать до ${a.dueAt.toLocaleDateString("ru-RU")}`
                      : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
