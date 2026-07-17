import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { DashboardHeader } from "@/components/dashboard-header";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Импорт задач из JSON" };

const EXAMPLE = `[
  {
    "topic_code": "OGE-9",
    "statement": "Решите уравнение $x^2-5x+6=0$. В ответе укажите меньший корень.",
    "answer_type": "SHORT",
    "answer": "2",
    "solution": "По теореме Виета корни 2 и 3.",
    "difficulty": 2,
    "source": "Ященко-2026",
    "tags": ["квадратные уравнения"]
  }
]`;

export default async function ImportPage() {
  const session = await requireTutor();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />
      <Link href="/tutor/tasks" className="text-sm font-semibold underline">
        ← К банку задач
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Импорт задач из JSON
      </h1>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="window-card p-6">
          <ImportForm />
        </div>

        <div className="window-card p-6 text-sm">
          <p className="eyebrow mb-3 text-muted">• Формат</p>
          <p className="mb-2">
            Массив задач. Обязательное поле — <code>statement</code>; для типа
            SHORT обязателен <code>answer</code>. Коды тем:{" "}
            <code>EGE_PROF-13</code>, <code>EGE_BASE-5</code>, <code>OGE-20</code>{" "}
            (экзамен-номер) или <code>CUSTOM:Название</code> для своей темы.
          </p>
          <pre className="overflow-x-auto rounded-lg border-[1.5px] border-ink/20 bg-cream p-3 text-xs">
            {EXAMPLE}
          </pre>
          <p className="mt-2 text-muted">
            Экспорт из банка выдаёт файл ровно в этом формате — можно переносить
            задачи между аккаунтами.
          </p>
        </div>
      </div>
    </div>
  );
}
