import type { Metadata } from "next";
import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";

export const metadata: Metadata = { title: "Кабинет ученика" };

export default async function StudentPage() {
  const session = await requireStudent();

  // Ученик видит только своё: имя своего репетитора, больше ничего чужого.
  const tutor = session.user.tutorId
    ? await prisma.user.findUnique({
        where: { id: session.user.tutorId },
        select: { name: true },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        Привет, {session.user.name}!
      </h1>
      {tutor && (
        <p className="mb-8 text-muted">
          Твой репетитор — <span className="font-semibold text-ink">{tutor.name}</span>.
        </p>
      )}

      <div className="window-card p-6">
        <p className="eyebrow mb-3 text-muted">• Задания</p>
        <p className="text-sm text-muted">
          Здесь появятся твои задания и результаты — совсем скоро, в следующих
          обновлениях платформы.
        </p>
      </div>
    </div>
  );
}
