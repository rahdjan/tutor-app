import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { formatTopicLabel } from "@/lib/curriculum-topics";
import { visibleTopicsWhere } from "@/lib/topic-visibility";
import {
  AddBankForm,
  AssignForm,
  AutoPickForm,
  DeleteSheetButton,
  MetaForm,
  SheetTaskRow,
} from "./controls";

export const metadata: Metadata = { title: "Рабочий лист" };

export default async function WorksheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireTutor();
  const tutorId = session.user.id;
  const { id } = await params;
  const sp = await searchParams;
  const bankTopic = typeof sp.bankTopic === "string" ? sp.bankTopic : "";
  const bankQ = typeof sp.bankQ === "string" ? sp.bankQ.trim() : "";

  // Изоляция: лист только свой.
  const sheet = await prisma.worksheet.findFirst({
    where: { id, tutorId },
    include: {
      tasks: {
        include: { task: true },
        orderBy: { order: "asc" },
      },
      assignments: {
        include: { student: { select: { name: true } } },
        orderBy: { assignedAt: "desc" },
      },
    },
  });
  if (!sheet) notFound();

  const addedTaskIds = new Set(sheet.tasks.map((t) => t.taskId));

  // Банк для добавления (фильтры из адресной строки)
  const bankTasks = await prisma.task.findMany({
    where: {
      tutorId,
      ...(bankTopic === "none" ? { topicId: null } : bankTopic ? { topicId: bankTopic } : {}),
      ...(bankQ
        ? {
            OR: [
              { statement: { contains: bankQ, mode: "insensitive" } },
              { tags: { has: bankQ } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, statement: true },
  });

  const topics = await prisma.topic.findMany({
    where: visibleTopicsWhere(session.user),
    orderBy: [{ exam: "asc" }, { grade: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true, grade: true, section: true },
  });
  const topicOptions = topics.map((t) => ({
    id: t.id,
    label: formatTopicLabel(t),
  }));

  const students = await prisma.student.findMany({
    where: { tutorId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, userId: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />

      <Link href="/tutor/worksheets" className="text-sm font-semibold underline">
        ← К списку листов
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{sheet.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tutor/worksheets/${sheet.id}/print`}
            className="btn-pill bg-butter"
          >
            🖨 Печатная версия
          </Link>
          <DeleteSheetButton worksheetId={sheet.id} />
        </div>
      </div>

      <section className="window-card mb-6 p-5">
        <MetaForm sheet={sheet} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Задачи листа */}
        <section className="window-card p-6">
          <p className="eyebrow mb-4 text-muted">
            • Задачи листа ({sheet.tasks.length})
          </p>
          {sheet.tasks.length === 0 ? (
            <p className="text-sm text-muted">
              Пока пусто. Добавьте задачи из банка справа — вручную галочками или
              автоподбором.
            </p>
          ) : (
            <ul className="space-y-3">
              {sheet.tasks.map((wt, i) => (
                <SheetTaskRow
                  key={wt.id}
                  worksheetId={sheet.id}
                  item={{
                    id: wt.id,
                    statement: wt.task.statement,
                    answerType: wt.task.answerType,
                    difficulty: wt.task.difficulty,
                  }}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === sheet.tasks.length - 1}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Автоподбор */}
          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Автоподбор из банка</p>
            <AutoPickForm worksheetId={sheet.id} topics={topicOptions} />
          </section>

          {/* Вручную из банка */}
          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Выбрать вручную</p>
            <form method="GET" className="mb-3 flex flex-wrap items-end gap-2">
              <div className="min-w-40 flex-1">
                <label className="field-label">Тема</label>
                <select name="bankTopic" defaultValue={bankTopic} className="input">
                  <option value="">Все</option>
                  <option value="none">Без темы</option>
                  {topicOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-32 flex-1">
                <label className="field-label">Поиск</label>
                <input name="bankQ" defaultValue={bankQ} className="input" />
              </div>
              <button type="submit" className="btn-pill bg-paper">
                Фильтр
              </button>
            </form>
            {bankTasks.length === 0 ? (
              <p className="text-sm text-muted">
                В банке нет подходящих задач.{" "}
                <Link href="/tutor/tasks/new" className="underline">
                  Добавить задачу
                </Link>
              </p>
            ) : (
              <AddBankForm
                worksheetId={sheet.id}
                tasks={bankTasks.map((t) => ({
                  id: t.id,
                  label:
                    t.statement.length > 120
                      ? t.statement.slice(0, 120) + "…"
                      : t.statement,
                  added: addedTaskIds.has(t.id),
                }))}
              />
            )}
          </section>

          {/* Выдача */}
          <section className="window-card p-6">
            <p className="eyebrow mb-4 text-muted">• Выдать ученику</p>
            {students.length === 0 ? (
              <p className="text-sm text-muted">
                Сначала добавьте ученика в разделе{" "}
                <Link href="/tutor" className="underline">
                  «Ученики»
                </Link>
                .
              </p>
            ) : (
              <AssignForm
                worksheetId={sheet.id}
                students={students.map((s) => ({
                  id: s.id,
                  name: s.name,
                  hasAccount: Boolean(s.userId),
                }))}
              />
            )}
            {sheet.assignments.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {sheet.assignments.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span>{a.student.name}</span>
                    <span className="text-muted">
                      выдано {a.assignedAt.toLocaleDateString("ru-RU")}
                      {a.dueAt
                        ? ` · сдать до ${a.dueAt.toLocaleDateString("ru-RU")}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
