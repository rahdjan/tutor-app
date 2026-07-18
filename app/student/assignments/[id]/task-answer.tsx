"use client";

// Ответ ученика на одну задачу.
// SHORT: поле ответа + мгновенный результат автопроверки.
// DETAILED: текст решения и/или фото — уходит репетитору.
import { useActionState, useState } from "react";
import { saveAnswer, type AnswerState } from "@/app/actions/submissions";

// Сжимаем фото в браузере: Vercel не пропускает запросы больше 4,5 МБ,
// а фото с камеры обычно тяжелее. Для проверки решения хватит 2000 px.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;
    // Если сжатие не помогло, а исходник и так мал — оставляем как есть
    if (blob.size >= file.size && file.size < 3 * 1024 * 1024) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // Формат не декодировался (редкий случай) — отправим оригинал
    return file;
  }
}

type Entry = {
  id: string;
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
  const [compressing, setCompressing] = useState(false);

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
                <a href={`/api/solution-photo/${entry.id}`} target="_blank" className="underline">
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
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="text-xs"
                onChange={async (e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  setCompressing(true);
                  try {
                    const small = await compressImage(file);
                    if (small !== file) {
                      const dt = new DataTransfer();
                      dt.items.add(small);
                      input.files = dt.files;
                    }
                  } finally {
                    setCompressing(false);
                  }
                }}
              />
            </label>
            <button
              type="submit"
              disabled={pending || compressing}
              className="btn-pill bg-butter px-4 py-1.5 text-sm disabled:opacity-60"
            >
              {compressing
                ? "Сжимаем фото…"
                : pending
                  ? "Отправляем…"
                  : "Сохранить решение"}
            </button>
          </div>
          {entry?.fileUrl && (
            <p className="text-xs">
              <a href={`/api/solution-photo/${entry.id}`} target="_blank" className="underline">
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
