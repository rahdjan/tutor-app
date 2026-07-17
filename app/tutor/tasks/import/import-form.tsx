"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importTasksJson, type ImportReport } from "@/app/actions/tasks";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportReport, FormData>(
    importTasksJson,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="file" className="field-label">
          Файл .json
        </label>
        <input id="file" name="file" type="file" accept=".json,application/json" className="input" />
      </div>
      <p className="text-center text-xs text-muted">— или —</p>
      <div>
        <label htmlFor="json" className="field-label">
          Вставьте JSON текстом
        </label>
        <textarea
          id="json"
          name="json"
          rows={10}
          className="input font-mono text-xs"
          placeholder='[ { "statement": "...", ... } ]'
        />
      </div>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <div className="rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-3 py-2 text-sm text-[#40662f]">
          <p>
            Импортировано задач: <b>{state.created}</b>.{" "}
            <Link href="/tutor/tasks" className="underline">
              Открыть банк
            </Link>
          </p>
          {state.problems && state.problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-[#8f6a25]">
              {state.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Импортируем…" : "Импортировать"}
      </button>
    </form>
  );
}
