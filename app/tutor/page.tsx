import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { GOAL_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Кабинет репетитора" };

export default async function TutorPage() {
  const session = await requireTutor();

  // Изоляция данных: только карточки текущего репетитора.
  const students = await prisma.student.findMany({
    where: { tutorId: session.user.id },
    include: {
      user: { select: { id: true } },
      invites: {
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Мои ученики</h1>
        <Link href="/tutor/students/new" className="btn-pill bg-butter">
          + Добавить ученика
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-2 font-semibold">Пока нет ни одного ученика</p>
          <p className="text-sm text-muted">
            Нажмите «Добавить ученика», заполните карточку — а затем отправьте
            ученику ссылку-приглашение из его карточки.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/tutor/students/${s.id}`}
                className="window-card block p-5 transition-transform hover:-translate-y-0.5"
              >
                <p className="mb-1 font-bold">{s.name}</p>
                <p className="text-sm text-muted">
                  {[
                    s.grade ? `${s.grade} класс` : null,
                    GOAL_LABELS[s.goal],
                    s.examDate
                      ? `экзамен ${s.examDate.toLocaleDateString("ru-RU")}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-3 text-xs">
                  {s.user ? (
                    <span className="text-[#4d7a3a]">Аккаунт привязан ✓</span>
                  ) : s.invites.length > 0 ? (
                    <span className="text-muted">Приглашение отправлено ⏳</span>
                  ) : (
                    <span className="text-muted">Без аккаунта</span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-muted">
        Банк задач, программа и задания появятся в следующих фазах.
      </p>
    </div>
  );
}
