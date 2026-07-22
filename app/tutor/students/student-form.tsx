"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { GOAL_LABELS, GOALS_BY_SUBJECT } from "@/lib/labels";
import type { Subject } from "@/app/generated/prisma/enums";

type StudentValues = {
  id?: string;
  name?: string;
  grade?: number | null;
  goal?: string;
  examDate?: Date | null;
  notes?: string | null;
  boardUrl?: string | null;
};

// Форма карточки ученика: одна на добавление и редактирование.
export function StudentForm({
  action,
  subject,
  initial = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  subject: Subject;
  initial?: StudentValues;
  submitLabel: string;
}) {
  const goals = GOALS_BY_SUBJECT[subject];
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label htmlFor="name" className="field-label">
          Имя или метка *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial.name ?? ""}
          className="input"
          placeholder="Например, «Маша (9 класс)»"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="grade" className="field-label">
            Класс
          </label>
          <input
            id="grade"
            name="grade"
            type="number"
            min={1}
            max={11}
            defaultValue={initial.grade ?? ""}
            className="input"
            placeholder="1–11"
          />
        </div>
        <div>
          <label htmlFor="goal" className="field-label">
            Цель подготовки
          </label>
          <select
            id="goal"
            name="goal"
            defaultValue={initial.goal ?? "OTHER"}
            className="input"
          >
            {goals.map((g) => (
              <option key={g} value={g}>
                {GOAL_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="examDate" className="field-label">
          Дата экзамена
        </label>
        <input
          id="examDate"
          name="examDate"
          type="date"
          defaultValue={
            initial.examDate
              ? new Date(initial.examDate).toISOString().slice(0, 10)
              : ""
          }
          className="input"
        />
      </div>

      <div>
        <label htmlFor="boardUrl" className="field-label">
          Ссылка на онлайн-доску
        </label>
        <input
          id="boardUrl"
          name="boardUrl"
          type="url"
          defaultValue={initial.boardUrl ?? ""}
          className="input"
          placeholder="https://miro.com/… — ученик увидит её в своём кабинете"
        />
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          Заметки
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial.notes ?? ""}
          className="input"
          placeholder="Что важно помнить об этом ученике"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-3 py-2 text-sm text-[#40662f]">
          Сохранено ✓
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : submitLabel}
      </button>
    </form>
  );
}
