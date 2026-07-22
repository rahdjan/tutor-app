"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { addPlanTopics } from "@/app/actions/plan";
import { topicGroupKey, topicGroupLabel, type TopicGroupBy } from "@/lib/topic-groups";
import type { Exam } from "@/app/generated/prisma/enums";

type TopicOption = {
  id: string;
  title: string;
  exam: Exam | null;
  kimNumber: number | null;
  grade?: number | null;
  section?: string | null;
  tutorId?: string | null;
};

// Выбор тем чекбоксами, сгруппированных в сворачиваемые блоки (или без
// группировки, если groupBy не задан/compact) — переиспользуется и для
// кодификатора ЕГЭ/ОГЭ (группа = экзамен), и для школьной программы
// (группа = класс), и для своих тем репетитора (без группировки).
export function AddTopicsForm({
  studentId,
  topics,
  addedTopicIds,
  groupBy,
  defaultOpenKey,
  compact = false,
}: {
  studentId: string;
  topics: TopicOption[];
  addedTopicIds: string[];
  groupBy?: TopicGroupBy;
  defaultOpenKey?: string | null;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addPlanTopics,
    {},
  );
  const added = new Set(addedTopicIds);

  const groups = new Map<string, TopicOption[]>();
  for (const t of topics) {
    const key = topicGroupKey(t, groupBy);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="studentId" value={studentId} />

      {[...groups.entries()].map(([key, list]) => {
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
        if (compact || !groupBy) {
          return <div key={key}>{body}</div>;
        }
        return (
          <details key={key} open={key === defaultOpenKey}>
            <summary className="cursor-pointer text-sm font-bold">
              {topicGroupLabel(key, groupBy)}{" "}
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
