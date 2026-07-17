import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { MathText } from "@/components/math-text";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Печать листа" };

// Печатная версия: шапка «Ученик/Дата/Оценка», условия без ответов и решений.
export default async function PrintWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  const sheet = await prisma.worksheet.findFirst({
    where: { id, tutorId: session.user.id },
    include: {
      tasks: {
        include: { task: { select: { statement: true } } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!sheet) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl bg-white px-8 py-8 text-black">
      {/* Панель управления — не печатается */}
      <div className="print-hide mb-6 flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-ink bg-cream px-4 py-3">
        <Link
          href={`/tutor/worksheets/${sheet.id}`}
          className="text-sm font-semibold underline"
        >
          ← Назад к листу
        </Link>
        <PrintButton />
      </div>

      {/* Шапка */}
      <div className="mb-6 border-b-2 border-black pb-4">
        <h1 className="mb-4 text-xl font-bold">{sheet.title}</h1>
        <div className="flex flex-wrap gap-x-10 gap-y-2 text-sm">
          <span>Ученик: ______________________</span>
          <span>Дата: ____________</span>
          <span>Оценка: ________</span>
        </div>
      </div>

      {/* Задачи — только условия */}
      <ol className="space-y-6">
        {sheet.tasks.map((wt, i) => (
          <li key={wt.id} className="flex gap-3">
            <span className="font-bold">{i + 1}.</span>
            <MathText text={wt.task.statement} className="flex-1" />
          </li>
        ))}
      </ol>

      {sheet.tasks.length === 0 && (
        <p className="text-sm opacity-60">В листе пока нет задач.</p>
      )}
    </div>
  );
}
