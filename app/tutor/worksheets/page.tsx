import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";

export const metadata: Metadata = { title: "Рабочие листы" };

export default async function WorksheetsPage() {
  const session = await requireTutor();

  // Изоляция: только свои листы.
  const sheets = await prisma.worksheet.findMany({
    where: { tutorId: session.user.id },
    include: {
      _count: { select: { tasks: true, assignments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Рабочие листы
        </h1>
        <Link href="/tutor/worksheets/new" className="btn-pill bg-butter">
          + Новый лист
        </Link>
      </div>

      {sheets.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-2 font-semibold">Пока нет ни одного листа</p>
          <p className="text-sm text-muted">
            Лист — это подборка задач из вашего банка: тест, домашняя работа,
            самостоятельная. Его можно распечатать или выдать ученику онлайн.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((s) => (
            <li key={s.id}>
              <Link
                href={`/tutor/worksheets/${s.id}`}
                className="window-card block p-5 transition-transform hover:-translate-y-0.5"
              >
                <p className="mb-1 font-bold">{s.title}</p>
                {s.description && (
                  <p className="mb-2 text-sm text-muted">{s.description}</p>
                )}
                <p className="text-xs text-muted">
                  задач: {s._count.tasks} · выдано: {s._count.assignments}
                </p>
                {s.tags.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1 text-xs">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded-full border border-ink/30 px-2">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
