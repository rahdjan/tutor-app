import Link from "next/link";
import { logout } from "@/app/actions/auth";

// Шапка кабинета: логотип, навигация (для репетитора), имя и выход.
export function DashboardHeader({
  userName,
  tutorNav = false,
}: {
  userName: string;
  tutorNav?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Репетитор<span className="font-serif italic font-medium">.Платформа</span>
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
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
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
