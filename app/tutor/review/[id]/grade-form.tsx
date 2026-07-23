"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { gradeEntry } from "@/app/actions/submissions";

export function GradeForm({
  entryId,
  initialScore,
  initialComment,
  mode = "score",
}: {
  entryId: string;
  initialScore: number | null;
  initialComment: string | null;
  /** "score" — свободный балл 0-99 (развёрнутые); "binary" — переопределение
   * автопроверки короткого ответа (верно/неверно/доверять автопроверке). */
  mode?: "score" | "binary";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    gradeEntry,
    {},
  );

  return (
    <form
      action={action}
      className="rounded-lg border-[1.5px] border-dashed border-ink/30 p-3"
    >
      <input type="hidden" name="entryId" value={entryId} />
      <div className="flex flex-wrap items-end gap-3">
        {mode === "binary" ? (
          <div>
            <label className="field-label">Ваша оценка</label>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="manualScore"
                  value="1"
                  defaultChecked={initialScore === 1}
                  className="accent-[#46231a]"
                />
                Верно
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="manualScore"
                  value="0"
                  defaultChecked={initialScore === 0}
                  className="accent-[#46231a]"
                />
                Неверно
              </label>
              <label className="flex items-center gap-1.5 text-muted">
                <input
                  type="radio"
                  name="manualScore"
                  value=""
                  defaultChecked={initialScore === null}
                  className="accent-[#46231a]"
                />
                Доверять автопроверке
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="field-label">Балл</label>
            <input
              name="manualScore"
              type="number"
              min={0}
              max={99}
              defaultValue={initialScore ?? ""}
              className="input w-20"
            />
          </div>
        )}
        <div className="min-w-48 flex-1">
          <label className="field-label">Комментарий ученику</label>
          <input
            name="comment"
            defaultValue={initialComment ?? ""}
            className="input"
            placeholder="Что хорошо, что поправить"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn-pill bg-butter px-4 py-1.5 text-sm disabled:opacity-60"
        >
          {pending
            ? "…"
            : mode === "binary"
              ? "Сохранить"
              : initialScore !== null
                ? "Обновить"
                : "Оценить"}
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-sm text-[#8f3a25]">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-2 text-sm font-semibold text-[#4d7a3a]">
          Сохранено ✓ Ученик увидит балл и комментарий.
        </p>
      )}
    </form>
  );
}
