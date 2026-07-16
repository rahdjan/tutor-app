"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { addCustomTopic } from "@/app/actions/plan";

export function CustomTopicForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addCustomTopic,
    {},
  );

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="studentId" value={studentId} />
      <input
        name="title"
        required
        maxLength={120}
        className="input flex-1"
        placeholder="Например, «Повторение: дроби»"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-pill shrink-0 bg-butter disabled:opacity-60"
      >
        {pending ? "…" : "Создать и добавить"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-[#8f3a25]">{state.error}</p>
      )}
    </form>
  );
}
