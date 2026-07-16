import type { Metadata } from "next";
import Link from "next/link";
import { TutorRegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация репетитора — Репетитор.Платформа",
};

export default function RegisterPage() {
  return (
    <div className="window-card p-6 sm:p-8">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">
        Кабинет репетитора
      </h1>
      <p className="mb-6 text-sm text-muted">
        Регистрация для репетиторов. Учеников вы потом пригласите по
        одноразовой ссылке из кабинета.
      </p>
      <TutorRegisterForm />
      <p className="mt-6 text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
