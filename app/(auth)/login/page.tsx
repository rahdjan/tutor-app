import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход — Репетитор.Платформа" };

export default function LoginPage() {
  return (
    <div className="window-card p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Вход</h1>
      <p className="mb-6 text-sm text-muted">
        Кабинет репетитора или ученика — по одной кнопке.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-muted">
        Вы репетитор и у вас ещё нет аккаунта?{" "}
        <Link href="/register" className="font-semibold underline">
          Зарегистрироваться
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Ученики регистрируются по ссылке-приглашению от своего репетитора.
      </p>
    </div>
  );
}
