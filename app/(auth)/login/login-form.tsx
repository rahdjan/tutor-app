"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="field-label">
          Почта
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-pill w-full justify-center bg-butter disabled:opacity-60">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
