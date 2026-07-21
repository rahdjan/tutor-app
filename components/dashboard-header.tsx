import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { Subject } from "@/app/generated/prisma/enums";

const SUBJECT_LABELS: Record<Subject, string> = {
  MATH: "Математика",
  ENGLISH: "Английский",
};

// Шапка кабинета: логотип, навигация (для репетитора), имя и выход.
export function DashboardHeader({
  userName,
  subject,
  tutorNav = false,
}: {
  userName: string;
  // Better Auth типизирует additionalFields как обычную строку — сужаем сами.
  subject?: string | null;
  tutorNav?: boolean;
}) {
  const subjectLabel = subject && subject in SUBJECT_LABELS ? SUBJECT_LABELS[subject as Subject] : null;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Платформа.<span className="font-serif italic font-medium">Репетитор</span>
        </Link>
        {tutorNav && (
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/tutor" className="hover:underline">
              Ученики
            </Link>
            <Link href="/tutor/tasks" className="hover:underline">
              Банк задач
            </Link>
            <Link href="/tutor/worksheets" className="hover:underline">
              Листы
            </Link>
            <Link href="/tutor/review" className="hover:underline">
              Проверка
            </Link>
            <Link href="/tutor/schedule" className="hover:underline">
              Расписание
            </Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        {subjectLabel && (
          <span className="hidden rounded-full border-[1.5px] border-ink/20 px-2.5 py-0.5 text-xs font-semibold text-muted sm:inline">
            {subjectLabel}
          </span>
        )}
        <span className="hidden text-sm text-muted sm:inline">{userName}</span>
        <form action={logout}>
          <button type="submit" className="btn-pill bg-paper px-4 py-1.5 text-sm">
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
