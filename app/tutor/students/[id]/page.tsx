import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { updateStudent, createStudentInvite } from "@/app/actions/students";
import { DashboardHeader } from "@/components/dashboard-header";
import { CopyButton } from "@/components/copy-button";
import { StudentForm } from "../student-form";
import { InviteButton } from "./invite-button";

export const metadata: Metadata = { title: "Карточка ученика" };

export default async function StudentCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  // Изоляция: карточка ищется только среди своих. Чужой id → 404.
  const student = await prisma.student.findFirst({
    where: { id, tutorId: session.user.id },
    include: {
      user: { select: { email: true } },
      invites: {
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!student) notFound();

  const activeInvite = student.invites[0];
  const baseUrl = process.env.BETTER_AUTH_URL ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <Link href="/tutor" className="text-sm font-semibold underline">
        ← К списку учеников
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {student.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/tutor/students/${student.id}/plan`}
            className="btn-pill bg-butter"
          >
            Программа →
          </Link>
          <Link
            href={`/tutor/students/${student.id}/lessons`}
            className="btn-pill bg-paper"
          >
            Уроки
          </Link>
          <Link
            href={`/tutor/students/${student.id}/stats`}
            className="btn-pill bg-paper"
          >
            Статистика
          </Link>
          <Link
            href={`/tutor/students/${student.id}/payments`}
            className="btn-pill bg-paper"
          >
            Оплаты
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="window-card p-6">
          <p className="eyebrow mb-4 text-muted">• Данные</p>
          <StudentForm
            action={updateStudent}
            initial={student}
            submitLabel="Сохранить"
          />
        </section>

        <section className="window-card p-6">
          <p className="eyebrow mb-4 text-muted">• Аккаунт ученика</p>

          {student.user ? (
            <p className="text-sm">
              Аккаунт привязан ✓{" "}
              <span className="text-muted">({student.user.email})</span>
              <br />
              <span className="text-muted">
                Ученик входит на сайт и видит свои задания.
              </span>
            </p>
          ) : activeInvite ? (
            <div className="space-y-3 text-sm">
              <p>
                Отправьте ученику ссылку — по ней он создаст аккаунт, привязанный
                к этой карточке:
              </p>
              <p className="break-all rounded-lg border-[1.5px] border-ink/20 px-3 py-2 text-xs text-muted">
                {baseUrl}/invite/{activeInvite.code}
              </p>
              <div className="flex items-center gap-3">
                <CopyButton text={`${baseUrl}/invite/${activeInvite.code}`} />
                <span className="text-xs text-muted">
                  действует до{" "}
                  {activeInvite.expiresAt.toLocaleDateString("ru-RU")}
                </span>
              </div>
              <InviteButton studentId={student.id} label="Создать новую ссылку" />
              <p className="text-xs text-muted">
                Новая ссылка отменяет старую.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-muted">
                Аккаунта пока нет. Создайте ссылку-приглашение и отправьте её
                ученику.
              </p>
              <InviteButton studentId={student.id} label="Создать приглашение" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
