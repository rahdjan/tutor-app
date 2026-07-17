"use client";

// Поток ИИ-импорта: загрузка → черновик (каждая задача редактируется,
// ненужные снимаются галочкой) → сохранение отмеченных через importTasksJson.
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { aiExtract, type AiImportState } from "@/app/actions/ai-import";
import { importTasksJson, type ImportReport } from "@/app/actions/tasks";
import type { AiDraft } from "@/lib/ai-import";
import { renderMathHtml } from "@/lib/latex";

type EditableDraft = AiDraft & { include: boolean };

function Preview({ text }: { text: string }) {
  return (
    <div
      className="rounded-lg border-[1.5px] border-dashed border-ink/30 bg-paper px-3 py-2 text-sm"
      dangerouslySetInnerHTML={{
        __html: text
          ? renderMathHtml(text)
          : '<span style="opacity:.4">Предпросмотр</span>',
      }}
    />
  );
}

export function AiImportFlow({
  topicOptions,
}: {
  topicOptions: { code: string; label: string }[];
}) {
  const [extractState, extractAction, extracting] = useActionState<
    AiImportState,
    FormData
  >(aiExtract, {});
  const [saveState, saveAction, saving] = useActionState<ImportReport, FormData>(
    importTasksJson,
    {},
  );

  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [topicCode, setTopicCode] = useState("");

  // Когда извлечение завершилось — раскладываем черновик в редактируемый список.
  useEffect(() => {
    if (extractState.drafts) {
      setDrafts(extractState.drafts.map((d) => ({ ...d, include: true })));
    }
  }, [extractState.drafts]);

  const patch = (i: number, upd: Partial<EditableDraft>) =>
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...upd } : d)));

  const selected = drafts.filter((d) => d.include);
  const saveJson = JSON.stringify(
    selected.map(({ include: _include, ...d }) => ({
      ...d,
      topic_code: topicCode || null,
    })),
  );

  return (
    <div className="space-y-6">
      {/* Шаг 1: загрузка */}
      <section className="window-card max-w-2xl p-6">
        <p className="eyebrow mb-4 text-muted">• Шаг 1 — материал</p>
        <form action={extractAction} className="space-y-4">
          <div>
            <label htmlFor="file" className="field-label">
              PDF или .txt (до 8 МБ)
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="input"
            />
          </div>
          <p className="text-center text-xs text-muted">— или —</p>
          <div>
            <label htmlFor="text" className="field-label">
              Текст с задачами
            </label>
            <textarea
              id="text"
              name="text"
              rows={6}
              className="input text-sm"
              placeholder="Вставьте сюда условие домашней работы, варианта…"
            />
          </div>
          {extractState.error && (
            <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
              {extractState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={extracting}
            className="btn-pill bg-butter disabled:opacity-60"
          >
            {extracting ? "Модель читает материал…" : "Извлечь задачи"}
          </button>
        </form>
      </section>

      {/* Шаг 2: черновик на проверку */}
      {drafts.length > 0 && (
        <section className="window-card p-6">
          <p className="eyebrow mb-2 text-muted">
            • Шаг 2 — проверьте черновик ({drafts.length})
          </p>
          <p className="mb-4 text-sm text-muted">
            Исправьте ошибки распознавания, снимите галочки с лишних. Сохранится
            только отмеченное.
          </p>

          <ul className="space-y-5">
            {drafts.map((d, i) => (
              <li
                key={i}
                className={`rounded-lg border-[1.5px] border-ink/25 p-4 ${d.include ? "" : "opacity-45"}`}
              >
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={d.include}
                    onChange={(e) => patch(i, { include: e.target.checked })}
                    className="accent-[#46231a]"
                  />
                  Задача {i + 1}
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea
                    rows={4}
                    value={d.statement}
                    onChange={(e) => patch(i, { statement: e.target.value })}
                    className="input font-mono text-xs"
                  />
                  <Preview text={d.statement} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <select
                    value={d.answer_type}
                    onChange={(e) =>
                      patch(i, {
                        answer_type: e.target.value as "SHORT" | "DETAILED",
                      })
                    }
                    className="input w-auto py-1"
                  >
                    <option value="SHORT">Краткий</option>
                    <option value="DETAILED">Развёрнутый</option>
                  </select>
                  <input
                    value={d.answer ?? ""}
                    onChange={(e) => patch(i, { answer: e.target.value || null })}
                    className="input w-32 py-1"
                    placeholder="Ответ"
                  />
                  <select
                    value={d.difficulty}
                    onChange={(e) => patch(i, { difficulty: Number(e.target.value) })}
                    className="input w-auto py-1"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        сложность {n}
                      </option>
                    ))}
                  </select>
                  <input
                    value={d.tags.join(", ")}
                    onChange={(e) =>
                      patch(i, {
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className="input min-w-40 flex-1 py-1"
                    placeholder="теги через запятую"
                  />
                </div>
                {d.answer_type === "SHORT" && !d.answer && (
                  <p className="mt-1 text-xs text-[#8f3a25]">
                    У краткой задачи нет ответа — заполните, иначе она будет
                    пропущена при сохранении.
                  </p>
                )}
              </li>
            ))}
          </ul>

          {/* Шаг 3: сохранение */}
          <form action={saveAction} className="mt-6 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="field-label">Тема для сохраняемых задач</label>
                <select
                  value={topicCode}
                  onChange={(e) => setTopicCode(e.target.value)}
                  className="input w-72"
                >
                  <option value="">Без темы</option>
                  {topicOptions.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <input type="hidden" name="json" value={saveJson} />
              <button
                type="submit"
                disabled={saving || selected.length === 0}
                className="btn-pill bg-butter disabled:opacity-60"
              >
                {saving
                  ? "Сохраняем…"
                  : `Сохранить в банк (${selected.length})`}
              </button>
            </div>
            {saveState.error && (
              <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
                {saveState.error}
              </p>
            )}
            {saveState.ok && (
              <div className="rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-3 py-2 text-sm text-[#40662f]">
                <p>
                  Сохранено задач: <b>{saveState.created}</b>.{" "}
                  <Link href="/tutor/tasks" className="underline">
                    Открыть банк
                  </Link>
                </p>
                {saveState.problems && saveState.problems.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-[#8f6a25]">
                    {saveState.problems.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
