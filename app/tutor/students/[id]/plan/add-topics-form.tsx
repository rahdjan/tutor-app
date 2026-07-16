"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { addPlanTopics } from "@/app/actions/plan";
import { EXAM_LABELS } from "@/lib/labels";
import type { Exam } from "@/app/generated/prisma/enums";

type TopicOption = {
  id: string;
  title: string;
  exam: Exam | null;
  kimNumber: number | null;
};

// Выбор тем чекбоксами. Темы кодификатора сгруппированы по экзамену
// в сворачиваемые блоки; уже добавленные показаны отключёнными.
export function AddTopicsForm({
  studentId,
  topics,
  addedTopicIds,
  defaultExam,
  compact = false,
}: {
  studentId: string;
  topics: TopicOption[];
  addedTopicIds: string[];
  defaultExam: Exam | null;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addPlanTopics,
    {},
  );
  const added = new Set(addedTopicIds);

  const groups = new Map<Exam | null, TopicOption[]>();
  for (const t of topics) {
    const list = groups.get(t.exam) ?? [];
    list.push(t);
    groups.set(t.exam, list);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />

      {[...groups.entries()].map(([exam, list]) => {
        const body = (
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
            {list.map((t) => (
              <li key={t.id}>
                <label
                  className={`flex items-start gap-2 text-sm ${added.has(t.id) ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="topicIds"
                    value={t.id}
                    disabled={added.has(t.id)}
                    className="mt-0.5 accent-[#46231a]"
                  />
                  <span>
                    {t.kimNumber ? `№${t.kimNumber} · ` : ""}
                    {t.title}
                    {added.has(t.id) ? " — уже в программе" : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        );
        if (compact || exam === null) {
          return <div key={exam ?? "custom"}>{body}</div>;
        }
        return (
          <details key={exam} open={exam === defaultExam}>
            <summary className="cursor-pointer text-sm font-bold">
              {EXAM_LABELS[exam]}{" "}
              <span className="font-normal text-muted">({list.length})</span>
            </summary>
            {body}
          </details>
        );
      })}

      {state.error && <p className="text-sm text-[#8f3a25]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Добавляем…" : "Добавить выбранные"}
      </button>
    </form>
  );
}
