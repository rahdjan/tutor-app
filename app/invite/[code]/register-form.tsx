"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerStudent, type FormState } from "@/app/actions/auth";

export function StudentRegisterForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    registerStudent,
    {},
  );
  const [under16, setUnder16] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />

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
          placeholder="Как тебя зовут"
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

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="under16"
          checked={under16}
          onChange={(e) => setUnder16(e.target.checked)}
          className="mt-0.5 accent-[#46231a]"
        />
        <span>Мне меньше 16 лет</span>
      </label>

      {under16 && (
        <label className="flex items-start gap-2.5 rounded-lg border-[1.5px] border-dashed border-ink/40 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="parentConsent"
            required
            className="mt-0.5 accent-[#46231a]"
          />
          <span>
            Мой родитель (законный представитель) ознакомился с политикой
            конфиденциальности и согласен на обработку моих персональных данных.
          </span>
        </label>
      )}

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
        {pending ? "Создаём аккаунт…" : "Создать аккаунт ученика"}
      </button>
    </form>
  );
}
