import type { Metadata } from "next";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { CopyButton } from "@/components/copy-button";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Кабинет репетитора" };

export default async function TutorPage() {
  const session = await requireTutor();
  const tutorId = session.user.id;

  // Изоляция данных: и ученики, и приглашения фильтруются по tutorId
  // текущего пользователя — чужого здесь не увидеть.
  const [students, invites] = await Promise.all([
    prisma.user.findMany({
      where: { tutorId, role: "STUDENT" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invite.findMany({
      where: { tutorId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const baseUrl = process.env.BETTER_AUTH_URL ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <h1 className="mt-4 mb-8 text-3xl font-extrabold tracking-tight">
        Кабинет репетитора
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ученики */}
        <section className="window-card p-6">
          <p className="eyebrow mb-3 text-muted">• Мои ученики</p>
          {students.length === 0 ? (
            <p className="text-sm text-muted">
              Пока никого нет. Создайте приглашение справа и отправьте ссылку
              ученику — после регистрации он появится здесь.
            </p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {students.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3 py-3">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm text-muted">{s.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Приглашения */}
        <section className="window-card p-6">
          <p className="eyebrow mb-3 text-muted">• Приглашения</p>
          <InviteForm />

          {invites.length > 0 && (
            <ul className="mt-5 space-y-3">
              {invites.map((invite) => {
                const url = `${baseUrl}/invite/${invite.code}`;
                const expired = !invite.usedAt && invite.expiresAt < new Date();
                return (
                  <li
                    key={invite.id}
                    className="rounded-lg border-[1.5px] border-ink/20 px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {invite.label ?? "Без подписи"}
                      </span>
                      {invite.usedAt ? (
                        <span className="text-[#4d7a3a]">Использовано ✓</span>
                      ) : expired ? (
                        <span className="text-[#8f3a25]">Истекло</span>
                      ) : (
                        <CopyButton text={url} />
                      )}
                    </div>
                    {!invite.usedAt && !expired && (
                      <p className="mt-1 break-all text-xs text-muted">{url}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-8 text-sm text-muted">
        Банк задач, программа и задания появятся в следующих фазах.
      </p>
    </div>
  );
}
