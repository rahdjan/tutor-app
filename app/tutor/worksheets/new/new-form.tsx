"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createWorksheet } from "@/app/actions/worksheets";

export function NewWorksheetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createWorksheet,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="title" className="field-label">
          Название *
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          placeholder="Например, «Линейные уравнения — самостоятельная»"
        />
      </div>
      <div>
        <label htmlFor="description" className="field-label">
          Описание
        </label>
        <input
          id="description"
          name="description"
          className="input"
          placeholder="Для чего этот лист"
        />
      </div>
      <div>
        <label htmlFor="tags" className="field-label">
          Теги (через запятую)
        </label>
        <input
          id="tags"
          name="tags"
          className="input"
          placeholder="7 класс, Мерзляк"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Создаём…" : "Создать и перейти к наполнению"}
      </button>
    </form>
  );
}
