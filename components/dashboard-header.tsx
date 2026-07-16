import Link from "next/link";
import { logout } from "@/app/actions/auth";

// Шапка кабинета: логотип, имя пользователя и выход.
export function DashboardHeader({ userName }: { userName: string }) {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Репетитор<span className="font-serif italic font-medium">.Платформа</span>
      </Link>
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
