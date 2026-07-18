"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { createPayment, deletePayment } from "@/app/actions/payments";

export function PaymentForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createPayment,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <label className="field-label">Сумма, ₽</label>
        <input name="amount" type="number" min={0} step="0.01" required
          className="input w-32" placeholder="8000" />
      </div>
      <div>
        <label className="field-label">Уроков в пакете</label>
        <input name="lessonsCount" type="number" min={1} max={100} defaultValue={1}
          className="input w-28" />
      </div>
      <div>
        <label className="field-label">Дата</label>
        <input name="paidAt" type="date" className="input" />
      </div>
      <div className="min-w-40 flex-1">
        <label className="field-label">Заметка</label>
        <input name="note" className="input" placeholder="перевод на карту" />
      </div>
      <button type="submit" disabled={pending} className="btn-pill bg-butter disabled:opacity-60">
        {pending ? "…" : "Добавить"}
      </button>
      {state.error && <p className="w-full text-sm text-[#8f3a25]">{state.error}</p>}
      {state.ok && <p className="w-full text-sm font-semibold text-[#4d7a3a]">Оплата записана ✓</p>}
    </form>
  );
}

export function PaymentRow({
  payment,
}: {
  payment: {
    id: string;
    paidAt: string;
    amount: string;
    lessonsCount: number;
    note: string | null;
  };
}) {
  const [, delAction] = useActionState<FormState, FormData>(deletePayment, {});
  return (
    <li className="window-card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
      <span>
        <b>{payment.paidAt}</b> · {payment.amount} ₽ · {payment.lessonsCount}{" "}
        {payment.lessonsCount === 1 ? "урок" : "урока(ов)"}
        {payment.note && <span className="text-muted"> · {payment.note}</span>}
      </span>
      <form
        action={delAction}
        onSubmit={(e) => {
          if (!confirm("Удалить запись об оплате?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="paymentId" value={payment.id} />
        <button type="submit" className="text-xs text-[#8f3a25] underline">
          удалить
        </button>
      </form>
    </li>
  );
}
