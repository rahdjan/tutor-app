"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerTutor, type FormState } from "@/app/actions/auth";

export function TutorRegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    registerTutor,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="field-label">
          Имя
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          className="input"
          placeholder="Как вас видят ученики"
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
          placeholder="Не короче 8 символов"
        />
      </div>

      <div>
        <span className="field-label">Направление</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="subject"
              value="MATH"
              defaultChecked
              required
              className="accent-[#46231a]"
            />
            Математика
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="subject" value="ENGLISH" className="accent-[#46231a]" />
            Английский
          </label>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[#46231a]" />
        <span>
          Я соглашаюсь с{" "}
          <Link href="/privacy" target="_blank" className="font-semibold underline">
            политикой конфиденциальности
          </Link>{" "}
          и даю согласие на обработку моих персональных данных.
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill w-full justify-center bg-butter disabled:opacity-60"
      >
        {pending ? "Создаём кабинет…" : "Создать кабинет"}
      </button>
    </form>
  );
}
