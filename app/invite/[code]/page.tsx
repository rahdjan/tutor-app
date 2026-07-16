import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StudentRegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация по приглашению — Репетитор.Платформа",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Приглашение ищем вместе с именем репетитора — показать ученику, к кому он идёт.
  const invite = await prisma.invite.findUnique({
    where: { code },
    include: { tutor: { select: { name: true } } },
  });
  const valid = invite && !invite.usedAt && invite.expiresAt > new Date();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
      <Link href="/" className="mb-10 text-center text-lg font-bold tracking-tight">
        Репетитор<span className="font-serif italic font-medium">.Платформа</span>
      </Link>

      {valid ? (
        <div className="window-card p-6 sm:p-8">
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight">
            Привет! 👋
          </h1>
          <p className="mb-6 text-sm text-muted">
            Репетитор <span className="font-semibold text-ink">{invite.tutor.name}</span>{" "}
            приглашает тебя на платформу. Создай аккаунт ученика — здесь будут
            твои задания и результаты.
          </p>
          <StudentRegisterForm code={code} />
        </div>
      ) : (
        <div className="window-card p-6 sm:p-8 text-center">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight">
            Ссылка не работает
          </h1>
          <p className="text-sm text-muted">
            Приглашение уже использовано или срок его действия истёк. Попроси у
            репетитора новую ссылку.
          </p>
          <p className="mt-6 text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold underline">
              Войти
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
