import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { MathText } from "@/components/math-text";
import { EXAM_LABELS } from "@/lib/labels";
import type { AnswerType, Prisma } from "@/app/generated/prisma/client";

export const metadata: Metadata = { title: "Банк задач" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireTutor();
  const tutorId = session.user.id;
  const sp = await searchParams;
  const topicFilter = typeof sp.topic === "string" ? sp.topic : "";
  const typeFilter = typeof sp.type === "string" ? sp.type : "";
  const difficultyFilter = typeof sp.difficulty === "string" ? sp.difficulty : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  // Изоляция: только свои задачи + фильтры поверх.
  const where: Prisma.TaskWhereInput = { tutorId };
  if (topicFilter === "none") where.topicId = null;
  else if (topicFilter) where.topicId = topicFilter;
  if (typeFilter === "SHORT" || typeFilter === "DETAILED") {
    where.answerType = typeFilter as AnswerType;
  }
  if (difficultyFilter) where.difficulty = Number(difficultyFilter);
  if (q) {
    where.OR = [
      { statement: { contains: q, mode: "insensitive" } },
      { source: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  const [tasks, topics, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { topic: { select: { title: true, exam: true, kimNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.topic.findMany({
      where: { OR: [{ tutorId: null }, { tutorId }] },
      orderBy: [{ exam: "asc" }, { order: "asc" }],
      select: { id: true, title: true, exam: true, kimNumber: true },
    }),
    prisma.task.count({ where: { tutorId } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Банк задач{" "}
          <span className="text-lg font-normal text-muted">({total})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/tutor/tasks/new" className="btn-pill bg-butter">
            + Новая задача
          </Link>
          <Link href="/tutor/tasks/import" className="btn-pill bg-paper">
            Импорт JSON
          </Link>
          <a href="/tutor/tasks/export" className="btn-pill bg-paper">
            Экспорт JSON
          </a>
        </div>
      </div>

      {/* Фильтры (обычная GET-форма, состояние в адресе страницы) */}
      <form className="mb-6 flex flex-wrap items-end gap-3" method="GET">
        <div>
          <label className="field-label">Тема</label>
          <select name="topic" defaultValue={topicFilter} className="input w-52">
            <option value="">Все темы</option>
            <option value="none">Без темы</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.exam
                  ? `${EXAM_LABELS[t.exam]} №${t.kimNumber} · ${t.title}`
                  : t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Тип</label>
          <select name="type" defaultValue={typeFilter} className="input w-36">
            <option value="">Любой</option>
            <option value="SHORT">Краткий</option>
            <option value="DETAILED">Развёрнутый</option>
          </select>
        </div>
        <div>
          <label className="field-label">Сложность</label>
          <select
            name="difficulty"
            defaultValue={difficultyFilter}
            className="input w-24"
          >
            <option value="">Любая</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Поиск</label>
          <input
            name="q"
            defaultValue={q}
            className="input w-48"
            placeholder="текст, источник, тег"
          />
        </div>
        <button type="submit" className="btn-pill bg-paper">
          Показать
        </button>
      </form>

      {tasks.length === 0 ? (
        <div className="window-card p-8 text-center">
          <p className="mb-2 font-semibold">
            {total === 0 ? "Банк пока пуст" : "Ничего не нашлось"}
          </p>
          <p className="text-sm text-muted">
            {total === 0
              ? "Добавьте первую задачу вручную или импортируйте из JSON."
              : "Попробуйте смягчить фильтры."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tutor/tasks/${t.id}`}
                className="window-card block p-4 transition-transform hover:-translate-y-0.5"
              >
                <MathText
                  text={
                    t.statement.length > 220
                      ? t.statement.slice(0, 220) + "…"
                      : t.statement
                  }
                  className="mb-2 text-sm"
                />
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>
                    {t.answerType === "SHORT" ? "краткий ответ" : "развёрнутый"}
                  </span>
                  <span>сложность {t.difficulty}/5</span>
                  {t.topic && (
                    <span>
                      {t.topic.exam
                        ? `${EXAM_LABELS[t.topic.exam]} №${t.topic.kimNumber}`
                        : t.topic.title}
                    </span>
                  )}
                  {t.source && <span>{t.source}</span>}
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-ink/30 px-2">
                      {tag}
                    </span>
                  ))}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
