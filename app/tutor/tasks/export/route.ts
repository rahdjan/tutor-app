// Экспорт банка задач в JSON — файл в том же формате, что принимает импорт.
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { topicCode } from "@/lib/task-codes";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Требуется вход репетитора" }, { status: 401 });
  }

  // Изоляция: экспортируются только задачи текущего репетитора.
  const tasks = await prisma.task.findMany({
    where: { tutorId: session.user.id },
    include: { topic: true },
    orderBy: { createdAt: "asc" },
  });

  const payload = tasks.map((t) => ({
    topic_code: t.topic ? topicCode(t.topic) : null,
    statement: t.statement,
    answer_type: t.answerType,
    answer: t.answer,
    solution: t.solution,
    difficulty: t.difficulty,
    source: t.source,
    tags: t.tags,
  }));

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tasks-export.json"',
    },
  });
}
