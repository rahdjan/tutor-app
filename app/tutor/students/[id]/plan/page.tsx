import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { PlanItemRow } from "./plan-item-row";
import { AddTopicsForm } from "./add-topics-form";
import { CustomTopicForm } from "./custom-topic-form";

export const metadata: Metadata = { title: "Программа подготовки" };

export default async function PlanPage({
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

  // План может ещё не существовать — тогда программа просто пуста
  // (создастся при первом добавлении темы).
  const plan = await prisma.studyPlan.findFirst({
    where: { studentId: student.id },
    include: {
      items: {
        include: { topic: true },
        orderBy: { order: "asc" },
      },
    },
  });
  const items = plan?.items ?? [];
  const mastered = items.filter((i) => i.status === "MASTERED").length;
  const progress = items.length > 0 ? Math.round((mastered / items.length) * 100) : 0;

  // Темы для выбора: общий кодификатор + свои темы репетитора.
  const topics = await prisma.topic.findMany({
    where: { OR: [{ tutorId: null }, { tutorId: session.user.id }] },
    orderBy: [{ exam: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true },
  });
  const addedTopicIds = new Set(items.map((i) => i.topicId));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <Link
        href={`/tutor/students/${student.id}`}
        className="text-sm font-semibold underline"
      >
        ← К карточке ученика
      </Link>
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        Программа · {student.name}
      </h1>

      {/* Прогресс готовности */}
      <div className="mb-8 max-w-xl">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted">
            Освоено {mastered} из {items.length} тем
          </span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border-[1.5px] border-ink bg-paper">
          <div
            className="h-full bg-butter transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Темы программы */}
        <section className="window-card p-6">
          <p className="eyebrow mb-4 text-muted">• Темы программы</p>
          {items.length === 0 ? (
            <p className="text-sm text-muted">
              Пока пусто. Добавьте темы из кодификатора справа — или создайте
              свою тему, если готовите не к экзамену.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, index) => (
                <PlanItemRow
                  key={item.id}
                  studentId={student.id}
                  item={{
                    id: item.id,
                    title: item.topic.title,
                    exam: item.topic.exam,
                    kimNumber: item.topic.kimNumber,
                    status: item.status,
                    plannedFor: item.plannedFor
                      ? item.plannedFor.toISOString().slice(0, 10)
                      : "",
                  }}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Добавление тем */}
        <div className="space-y-6">
          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Из кодификатора</p>
            <AddTopicsForm
              studentId={student.id}
              topics={topics.filter((t) => t.exam !== null)}
              addedTopicIds={[...addedTopicIds]}
              defaultExam={student.goal !== "OTHER" ? student.goal : null}
            />
          </section>

          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Своя тема</p>
            <CustomTopicForm studentId={student.id} />
            {topics.some((t) => t.exam === null && !addedTopicIds.has(t.id)) && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted">
                  Ваши темы, ещё не добавленные в эту программу:
                </p>
                <AddTopicsForm
                  studentId={student.id}
                  topics={topics.filter((t) => t.exam === null)}
                  addedTopicIds={[...addedTopicIds]}
                  defaultExam={null}
                  compact
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
