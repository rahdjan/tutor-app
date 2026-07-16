"use client";

import { useActionState } from "react";
import { createInvite, type FormState } from "@/app/actions/auth";

export function InviteForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createInvite,
    {},
  );

  return (
    <form action={action} className="flex gap-2">
      <input
        name="label"
        className="input flex-1"
        placeholder="Кому ссылка? (например, «Маша, 9 класс»)"
        maxLength={80}
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-pill shrink-0 bg-butter disabled:opacity-60"
      >
        {pending ? "Создаём…" : "Создать"}
      </button>
      {state.error && <p className="text-sm text-[#8f3a25]">{state.error}</p>}
    </form>
  );
}
