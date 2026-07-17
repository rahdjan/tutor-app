"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { deleteTask } from "@/app/actions/tasks";

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [, action, pending] = useActionState<FormState, FormData>(
    deleteTask,
    {},
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Удалить задачу из банка? Это действие необратимо.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={taskId} />
      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-paper text-sm text-[#8f3a25] disabled:opacity-60"
      >
        {pending ? "Удаляем…" : "Удалить задачу"}
      </button>
    </form>
  );
}
