import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { studentBalance } from "@/lib/balance";
import { DashboardHeader } from "@/components/dashboard-header";
import { PaymentForm, PaymentRow } from "./payment-forms";

export const metadata: Metadata = { title: "Оплаты" };

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireTutor();
  const { id } = await params;

  // Изоляция: карточка только своя.
  const student = await prisma.student.findFirst({
    where: { id, tutorId: session.user.id },
  });
  if (!student) notFound();

  const [payments, balance] = await Promise.all([
    prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { paidAt: "desc" },
    }),
    studentBalance(student.id),
  ]);
  const totalMoney = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} tutorNav />

      <Link
        href={`/tutor/students/${student.id}`}
        className="text-sm font-semibold underline"
      >
        ← К карточке ученика
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Оплаты · {student.name}
      </h1>

      {/* Баланс пакета */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="window-card p-4 text-center">
          <p className="text-2xl font-extrabold">{balance.purchased}</p>
          <p className="text-sm text-muted">уроков оплачено</p>
        </div>
        <div className="window-card p-4 text-center">
          <p className="text-2xl font-extrabold">{balance.done}</p>
          <p className="text-sm text-muted">проведено</p>
        </div>
        <div
          className={`window-card p-4 text-center ${balance.balance < 0 ? "border-[#b3492f]" : ""}`}
        >
          <p
            className={`text-2xl font-extrabold ${balance.balance < 0 ? "text-[#8f3a25]" : balance.balance <= 1 ? "text-[#8f6a25]" : "text-[#4d7a3a]"}`}
          >
            {balance.balance}
          </p>
          <p className="text-sm text-muted">
            {balance.balance < 0 ? "долг (уроков)" : "осталось в пакете"}
          </p>
        </div>
      </div>

      <section className="window-card mb-6 p-6">
        <p className="eyebrow mb-4 text-muted">• Новая оплата</p>
        <PaymentForm studentId={student.id} />
      </section>

      <section>
        <p className="eyebrow mb-3 text-muted">
          • История ({payments.length} · всего {totalMoney.toLocaleString("ru-RU")} ₽)
        </p>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">Оплат пока не было.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <PaymentRow
                key={p.id}
                payment={{
                  id: p.id,
                  paidAt: p.paidAt.toLocaleDateString("ru-RU"),
                  amount: Number(p.amount).toLocaleString("ru-RU"),
                  lessonsCount: p.lessonsCount ?? 1,
                  note: p.note,
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
