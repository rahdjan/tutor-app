"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createStudentInvite } from "@/app/actions/students";

export function InviteButton({
  studentId,
  label,
}: {
  studentId: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createStudentInvite,
    {},
  );

  return (
    <form action={action}>
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Создаём…" : label}
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-[#8f3a25]">{state.error}</p>
      )}
    </form>
  );
}
