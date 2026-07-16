"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import {
  movePlanItem,
  removePlanItem,
  updatePlanItem,
} from "@/app/actions/plan";
import { EXAM_LABELS, PLAN_STATUS_LABELS } from "@/lib/labels";
import type { Exam, PlanStatus } from "@/app/generated/prisma/enums";

const STATUS_COLORS: Record<PlanStatus, string> = {
  NOT_STARTED: "bg-paper",
  IN_PROGRESS: "bg-[#fdeec9]",
  MASTERED: "bg-[#e8f2df]",
};

export function PlanItemRow({
  studentId,
  item,
  isFirst,
  isLast,
}: {
  studentId: string;
  item: {
    id: string;
    title: string;
    exam: Exam | null;
    kimNumber: number | null;
    status: PlanStatus;
    plannedFor: string;
  };
  isFirst: boolean;
  isLast: boolean;
}) {
  const [saveState, saveAction, saving] = useActionState<FormState, FormData>(
    updatePlanItem,
    {},
  );
  const [, moveAction] = useActionState<FormState, FormData>(movePlanItem, {});
  const [, removeAction] = useActionState<FormState, FormData>(
    removePlanItem,
    {},
  );

  const badge =
    item.exam && item.kimNumber
      ? `${EXAM_LABELS[item.exam]} №${item.kimNumber}`
      : item.exam
        ? EXAM_LABELS[item.exam]
        : "своя тема";

  return (
    <li
      className={`rounded-lg border-[1.5px] border-ink/25 p-3 ${STATUS_COLORS[item.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold leading-snug">{item.title}</p>
          <p className="text-xs text-muted">{badge}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Порядок */}
          <form action={moveAction}>
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs disabled:opacity-30"
              title="Выше"
            >
              ↑
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs disabled:opacity-30"
              title="Ниже"
            >
              ↓
            </button>
          </form>
          <form
            action={removeAction}
            onSubmit={(e) => {
              if (!confirm("Убрать тему из программы?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs"
              title="Убрать из программы"
            >
              ✕
            </button>
          </form>
        </div>
      </div>

      {/* Статус и дата */}
      <form action={saveAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="itemId" value={item.id} />
        <select
          name="status"
          defaultValue={item.status}
          className="input w-auto py-1 text-sm"
        >
          {(Object.keys(PLAN_STATUS_LABELS) as PlanStatus[]).map((s) => (
            <option key={s} value={s}>
              {PLAN_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="plannedFor"
          defaultValue={item.plannedFor}
          className="input w-auto py-1 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-pill bg-paper px-3 py-1 text-xs disabled:opacity-60"
        >
          {saving ? "…" : "Сохранить"}
        </button>
        {saveState.error && (
          <span className="text-xs text-[#8f3a25]">{saveState.error}</span>
        )}
      </form>
    </li>
  );
}
