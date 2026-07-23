"use client";

// Интерактивные элементы конструктора листа.
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import {
  addWorksheetTasks,
  assignWorksheet,
  autoPickTasks,
  deleteWorksheet,
  moveWorksheetTask,
  removeWorksheetTask,
  updateWorksheet,
} from "@/app/actions/worksheets";
import { renderMathHtml } from "@/lib/latex";

function ErrorNote({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
      {text}
    </p>
  );
}

function OkNote({ show, text = "Готово ✓" }: { show?: boolean; text?: string }) {
  if (!show) return null;
  return (
    <p className="rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-3 py-2 text-sm text-[#40662f]">
      {text}
    </p>
  );
}

/** Название/описание/теги листа. */
export function MetaForm({
  sheet,
}: {
  sheet: { id: string; title: string; description: string | null; tags: string[] };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateWorksheet,
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={sheet.id} />
      <div className="min-w-52 flex-1">
        <label className="field-label">Название</label>
        <input name="title" defaultValue={sheet.title} required className="input" />
      </div>
      <div className="min-w-40 flex-1">
        <label className="field-label">Описание</label>
        <input name="description" defaultValue={sheet.description ?? ""} className="input" />
      </div>
      <div className="min-w-40 flex-1">
        <label className="field-label">Теги</label>
        <input name="tags" defaultValue={sheet.tags.join(", ")} className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-pill bg-paper disabled:opacity-60">
        {pending ? "…" : "Сохранить"}
      </button>
      <ErrorNote text={state.error} />
      <OkNote show={state.ok} text="Сохранено ✓" />
    </form>
  );
}

/** Строка задачи в листе: порядок и удаление. */
export function SheetTaskRow({
  worksheetId,
  item,
  index,
  isFirst,
  isLast,
}: {
  worksheetId: string;
  item: { id: string; statement: string; answerType: string; difficulty: number };
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [, moveAction] = useActionState<FormState, FormData>(moveWorksheetTask, {});
  const [, removeAction] = useActionState<FormState, FormData>(removeWorksheetTask, {});

  return (
    <li className="rounded-lg border-[1.5px] border-ink/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <span className="font-bold">{index + 1}.</span>
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{
              __html: renderMathHtml(
                item.statement.length > 180
                  ? item.statement.slice(0, 180) + "…"
                  : item.statement,
              ),
            }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <form action={moveAction}>
            <input type="hidden" name="worksheetId" value={worksheetId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" disabled={isFirst} title="Выше"
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs disabled:opacity-30">
              ↑
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="worksheetId" value={worksheetId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" disabled={isLast} title="Ниже"
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs disabled:opacity-30">
              ↓
            </button>
          </form>
          <form action={removeAction}>
            <input type="hidden" name="worksheetId" value={worksheetId} />
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" title="Убрать из листа"
              className="rounded border-[1.5px] border-ink/30 px-1.5 text-xs">
              ✕
            </button>
          </form>
        </div>
      </div>
      <p className="mt-1 pl-6 text-xs text-muted">
        {item.answerType === "SHORT" ? "краткий ответ" : "развёрнутый"} ·
        сложность {item.difficulty}/5
      </p>
    </li>
  );
}

/** Добавление отмеченных задач из банка. */
export function AddBankForm({
  worksheetId,
  tasks,
}: {
  worksheetId: string;
  tasks: { id: string; label: string; added: boolean }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addWorksheetTasks,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="worksheetId" value={worksheetId} />
      <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {tasks.map((t) => (
          <li key={t.id}>
            <label className={`flex items-start gap-2 text-sm ${t.added ? "opacity-40" : ""}`}>
              <input
                type="checkbox"
                name="taskIds"
                value={t.id}
                disabled={t.added}
                className="mt-0.5 accent-[#46231a]"
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: renderMathHtml(t.label) + (t.added ? " — уже в листе" : ""),
                }}
              />
            </label>
          </li>
        ))}
      </ul>
      <ErrorNote text={state.error} />
      <button type="submit" disabled={pending} className="btn-pill bg-butter disabled:opacity-60">
        {pending ? "Добавляем…" : "Добавить отмеченные"}
      </button>
    </form>
  );
}

/** Автоподбор случайных задач. */
export function AutoPickForm({
  worksheetId,
  topics,
}: {
  worksheetId: string;
  topics: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    autoPickTasks,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="worksheetId" value={worksheetId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-44 flex-1">
          <label className="field-label">Тема</label>
          <select name="topicId" className="input">
            <option value="">Любая</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Сложность</label>
          <div className="flex items-center gap-1">
            <select name="diffMin" defaultValue={1} className="input w-16">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>—</span>
            <select name="diffMax" defaultValue={5} className="input w-16">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Сколько</label>
          <input name="count" type="number" min={1} max={30} defaultValue={5} className="input w-20" />
        </div>
      </div>
      <ErrorNote text={state.error} />
      <OkNote show={state.ok} text="Добавлено ✓" />
      <button type="submit" disabled={pending} className="btn-pill bg-paper disabled:opacity-60">
        {pending ? "Подбираем…" : "🎲 Подобрать случайные"}
      </button>
    </form>
  );
}

/** Выдача листа ученику. */
export function AssignForm({
  worksheetId,
  students,
}: {
  worksheetId: string;
  students: { id: string; name: string; hasAccount: boolean }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    assignWorksheet,
    {},
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="worksheetId" value={worksheetId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-44 flex-1">
          <label className="field-label">Ученик</label>
          <select name="studentId" required className="input">
            <option value="">— выберите —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.hasAccount ? "" : " (без аккаунта)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Срок сдачи</label>
          <input name="dueAt" type="date" className="input" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-pill bg-butter disabled:opacity-60">
        {pending ? "Выдаём…" : "Выдать"}
      </button>
      <ErrorNote text={state.error} />
      <OkNote show={state.ok} text="Выдано ✓ Ученик увидит задание в своём кабинете." />
    </form>
  );
}

/** Удаление листа. */
export function DeleteSheetButton({ worksheetId }: { worksheetId: string }) {
  const [, action, pending] = useActionState<FormState, FormData>(
    deleteWorksheet,
    {},
  );
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Удалить лист? Выданные по нему задания тоже удалятся.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={worksheetId} />
      <button type="submit" disabled={pending}
        className="btn-pill bg-paper text-sm text-[#8f3a25] disabled:opacity-60">
        {pending ? "…" : "Удалить лист"}
      </button>
    </form>
  );
}
