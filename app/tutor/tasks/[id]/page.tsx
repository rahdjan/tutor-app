import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { updateTask } from "@/app/actions/tasks";
import { DashboardHeader } from "@/components/dashboard-header";
import { TaskForm } from "../task-form";
import { DeleteTaskButton } from "./delete-button";

export const metadata: Metadata = { title: "Задача" };

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  // Изоляция: задача только своя, чужой id → 404.
  const task = await prisma.task.findFirst({
    where: { id, tutorId: session.user.id },
  });
  if (!task) notFound();

  const topics = await prisma.topic.findMany({
    where: { OR: [{ tutorId: null }, { tutorId: session.user.id }] },
    orderBy: [{ exam: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true, grade: true, tutorId: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />
      <Link href="/tutor/tasks" className="text-sm font-semibold underline">
        ← К банку задач
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Редактирование задачи
        </h1>
        <DeleteTaskButton taskId={task.id} />
      </div>
      <div className="window-card p-6">
        <TaskForm
          action={updateTask}
          topics={topics}
          initial={task}
          submitLabel="Сохранить"
        />
      </div>
    </div>
  );
}
