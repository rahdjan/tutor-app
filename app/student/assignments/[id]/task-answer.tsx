"use client";

// Ответ ученика на одну задачу.
// SHORT: поле ответа + мгновенный результат автопроверки.
// DETAILED: текст решения и/или фото — уходит репетитору.
import { useActionState } from "react";
import { saveAnswer, type AnswerState } from "@/app/actions/submissions";

type Entry = {
  answerText: string | null;
  fileUrl: string | null;
  autoScore: number | null;
  manualScore: number | null;
  comment: string | null;
};

export function TaskAnswer({
  assignmentId,
  taskId,
  answerType,
  submitted,
  entry,
}: {
  assignmentId: string;
  taskId: string;
  answerType: string;
  submitted: boolean;
  entry: Entry | null;
}) {
  const [state, action, pending] = useActionState<AnswerState, FormData>(
    saveAnswer,
    {},
  );

  // Итог для показа: свежий результат из action или сохранённый из БД
  const shortResult =
    state.correct !== undefined && state.correct !== null
      ? state.correct
      : entry?.autoScore !== null && entry?.autoScore !== undefined
        ? entry.autoScore === 1
        : null;

  if (submitted) {
    return (
      <div className="space-y-2 pl-8 text-sm">
        {entry ? (
          <>
            {entry.answerText && (
              <p>
                Твой ответ: <b>{entry.answerText}</b>
              </p>
            )}
            {entry.fileUrl && (
              <p>
                <a href={entry.fileUrl} target="_blank" className="underline">
                  📷 Фото решения
                </a>
              </p>
            )}
            {answerType === "SHORT" ? (
              shortResult ? (
                <p className="font-semibold text-[#4d7a3a]">Верно ✓ (1 балл)</p>
              ) : (
                <p className="font-semibold text-[#8f3a25]">Неверно ✗ (0 баллов)</p>
              )
            ) : entry.manualScore !== null ? (
              <p className="font-semibold text-[#4d7a3a]">
                Балл репетитора: {entry.manualScore}
              </p>
            ) : (
              <p className="text-muted">Ждёт проверки репетитора</p>
            )}
            {entry.comment && (
              <p className="rounded-lg border-[1.5px] border-ink/20 bg-cream px-3 py-2">
                💬 {entry.comment}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted">Без ответа</p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2 pl-8">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="taskId" value={taskId} />

      {answerType === "SHORT" ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            name="answerText"
            defaultValue={entry?.answerText ?? ""}
            className="input w-48"
            placeholder="Ответ"
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-pill bg-butter px-4 py-1.5 text-sm disabled:opacity-60"
          >
            {pending ? "…" : "Ответить"}
          </button>
          {shortResult !== null && (
            <span
              className={`font-semibold ${shortResult ? "text-[#4d7a3a]" : "text-[#8f3a25]"}`}
            >
              {shortResult ? "Верно ✓" : "Неверно ✗ — можно исправить"}
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            name="answerText"
            rows={4}
            defaultValue={entry?.answerText ?? ""}
            className="input text-sm"
            placeholder="Запиши решение текстом…"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted">
              📷 или фото решения:{" "}
              <input type="file" name="photo" accept="image/*" className="text-xs" />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="btn-pill bg-butter px-4 py-1.5 text-sm disabled:opacity-60"
            >
              {pending ? "Отправляем…" : "Сохранить решение"}
            </button>
          </div>
          {entry?.fileUrl && (
            <p className="text-xs">
              <a href={entry.fileUrl} target="_blank" className="underline">
                Загруженное фото
              </a>
            </p>
          )}
          {state.saved && state.correct === null && (
            <p className="text-sm font-semibold text-[#4d7a3a]">
              Сохранено ✓ Репетитор проверит после сдачи работы.
            </p>
          )}
        </div>
      )}

      {state.error && (
        <p className="text-sm text-[#8f3a25]">{state.error}</p>
      )}
    </form>
  );
}
