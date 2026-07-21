import Link from "next/link";

// Общая обёртка страниц входа и регистрации: логотип сверху, карточка по центру.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
      <Link href="/" className="mb-10 text-center text-lg font-bold tracking-tight">
        Платформа.<span className="font-serif italic font-medium">Репетитор</span>
      </Link>
      {children}
    </div>
  );
}
