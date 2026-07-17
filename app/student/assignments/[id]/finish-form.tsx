"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { finishSubmission } from "@/app/actions/submissions";

export function FinishForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    finishSubmission,
    {},
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Сдать работу? После сдачи изменить ответы будет нельзя.")) {
          e.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="finish" value="1" />
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
        {pending ? "Сдаём…" : "✅ Сдать работу"}
      </button>
      <p className="text-xs text-muted">
        Пока работа не сдана, ответы можно менять сколько угодно.
      </p>
    </form>
  );
}
