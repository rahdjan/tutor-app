import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { topicCode } from "@/lib/task-codes";
import { formatTopicLabel, OTHER_TOPIC_TITLE } from "@/lib/curriculum-topics";
import { visibleTopicsWhere } from "@/lib/topic-visibility";
import { AiImportFlow } from "./ai-import-flow";

export const metadata: Metadata = { title: "ИИ-импорт задач" };

export default async function AiImportPage() {
  const session = await requireTutor();

  // Темы для выпадающего списка (код темы → подпись)
  const topics = await prisma.topic.findMany({
    where: visibleTopicsWhere(session.user),
    orderBy: [{ exam: "asc" }, { grade: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true, grade: true, section: true, tutorId: true },
  });
  const topicOptions = topics.map((t) => ({
    code: topicCode(t),
    label: formatTopicLabel(t),
  }));

  // Отдельно: только общая школьная программа + «Другое» — по этому списку
  // модель классифицирует задачи (см. app/actions/ai-import.ts), нужен для
  // выбора темы у каждой отдельной задачи в черновике.
  const curriculumTopicOptions = topics
    .filter((t) => t.exam === null && t.tutorId === null)
    .map((t) => ({
      code: topicCode(t),
      title: t.title,
      label: formatTopicLabel(t),
    }));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />
      <Link href="/tutor/tasks" className="text-sm font-semibold underline">
        ← К банку задач
      </Link>
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        ИИ-импорт задач
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Загрузите PDF или вставьте текст — модель соберёт черновик задач и
        расставит темы по программе 5–11 класс (то, что не подошло —
        «{OTHER_TOPIC_TITLE}»).{" "}
        <b className="text-ink">
          Модель может ошибаться: проверьте каждую задачу перед сохранением.
        </b>{" "}
        В банк попадёт только то, что вы отметите и подтвердите.
      </p>

      <AiImportFlow
        topicOptions={topicOptions}
        curriculumTopicOptions={curriculumTopicOptions}
      />
    </div>
  );
}
