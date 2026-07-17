import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createTask } from "@/app/actions/tasks";
import { DashboardHeader } from "@/components/dashboard-header";
import { TaskForm } from "../task-form";

export const metadata: Metadata = { title: "Новая задача" };

export default async function NewTaskPage() {
  const session = await requireTutor();
  const topics = await prisma.topic.findMany({
    where: { OR: [{ tutorId: null }, { tutorId: session.user.id }] },
    orderBy: [{ exam: "asc" }, { order: "asc" }],
    select: { id: true, title: true, exam: true, kimNumber: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />
      <Link href="/tutor/tasks" className="text-sm font-semibold underline">
        ← К банку задач
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Новая задача
      </h1>
      <div className="window-card p-6">
        <TaskForm action={createTask} topics={topics} submitLabel="Добавить в банк" />
      </div>
    </div>
  );
}
