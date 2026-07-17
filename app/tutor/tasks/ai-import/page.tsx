import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { topicCode } from "@/lib/task-codes";
import { EXAM_LABELS } from "@/lib/labels";
import { AiImportFlow } from "./ai-import-flow";

export const metadata: Metadata = { title: "ИИ-импорт задач" };

export default async function AiImportPage() {
  const session = await requireTutor();

  // Темы для выпадающего списка (код темы → подпись)
  const topics = await prisma.topic.findMany({
    where: { OR: [{ tutorId: null }, { tutorId: session.user.id }] },
    orderBy: [{ exam: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true },
  });
  const topicOptions = topics.map((t) => ({
    code: topicCode(t),
    label: t.exam
      ? `${EXAM_LABELS[t.exam]} №${t.kimNumber} · ${t.title}`
      : t.title,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />
      <Link href="/tutor/tasks" className="text-sm font-semibold underline">
        ← К банку задач
      </Link>
      <h1 className="mt-4 mb-2 text-3xl font-extrabold tracking-tight">
        ИИ-импорт задач
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Загрузите PDF или вставьте текст — модель соберёт черновик задач.{" "}
        <b className="text-ink">
          Модель может ошибаться: проверьте каждую задачу перед сохранением.
        </b>{" "}
        В банк попадёт только то, что вы отметите и подтвердите.
      </p>

      <AiImportFlow topicOptions={topicOptions} />
    </div>
  );
}
