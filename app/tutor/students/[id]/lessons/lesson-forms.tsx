"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createLesson, deleteLesson, updateLesson } from "@/app/actions/lessons";
import { LESSON_STATUS_LABELS } from "@/lib/labels";
import type { LessonStatus } from "@/app/generated/prisma/enums";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Добавление урока. */
export function LessonForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createLesson,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <label className="field-label">Дата и время</label>
        <input name="scheduledAt" type="datetime-local" required className="input" />
      </div>
      <div>
        <label className="field-label">Минут</label>
        <input name="durationMin" type="number" min={15} max={240} step={5}
          defaultValue={60} className="input w-24" />
      </div>
      <div className="min-w-52 flex-1">
        <label className="field-label">Тема / конспект</label>
        <input name="note" className="input" placeholder="Что проходили или планируете" />
      </div>
      <button type="submit" disabled={pending} className="btn-pill bg-butter disabled:opacity-60">
        {pending ? "…" : "Добавить"}
      </button>
      {state.error && <p className="w-full text-sm text-[#8f3a25]">{state.error}</p>}
      {state.ok && <p className="w-full text-sm font-semibold text-[#4d7a3a]">Урок добавлен ✓</p>}
    </form>
  );
}

/** Строка урока: правка и удаление. */
export function LessonRow({
  lesson,
}: {
  lesson: {
    id: string;
    scheduledAt: string;
    durationMin: number;
    note: string | null;
    status: LessonStatus;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateLesson,
    {},
  );
  const [, delAction] = useActionState<FormState, FormData>(deleteLesson, {});

  return (
    <li className="window-card p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="lessonId" value={lesson.id} />
        <div>
          <label className="field-label">Дата и время</label>
          <input name="scheduledAt" type="datetime-local" required
            defaultValue={toLocalInputValue(lesson.scheduledAt)} className="input" />
        </div>
        <div>
          <label className="field-label">Минут</label>
          <input name="durationMin" type="number" min={15} max={240} step={5}
            defaultValue={lesson.durationMin} className="input w-24" />
        </div>
        <div className="min-w-52 flex-1">
          <label className="field-label">Тема / конспект</label>
          <input name="note" defaultValue={lesson.note ?? ""} className="input" />
        </div>
        <div>
          <label className="field-label">Статус</label>
          <select name="status" defaultValue={lesson.status} className="input">
            {(Object.keys(LESSON_STATUS_LABELS) as LessonStatus[]).map((st) => (
              <option key={st} value={st}>
                {LESSON_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending}
          className="btn-pill bg-paper px-4 py-1.5 text-sm disabled:opacity-60">
          {pending ? "…" : "Сохранить"}
        </button>
        {state.error && <p className="w-full text-sm text-[#8f3a25]">{state.error}</p>}
        {state.ok && <p className="w-full text-sm font-semibold text-[#4d7a3a]">Сохранено ✓</p>}
      </form>
      <form
        action={delAction}
        className="mt-2"
        onSubmit={(e) => {
          if (!confirm("Удалить урок?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="lessonId" value={lesson.id} />
        <button type="submit" className="text-xs text-[#8f3a25] underline">
          Удалить урок
        </button>
      </form>
    </li>
  );
}
