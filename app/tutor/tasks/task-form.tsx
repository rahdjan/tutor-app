"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import { renderMathHtml } from "@/lib/latex";
import { EXAM_LABELS } from "@/lib/labels";
import type { Exam } from "@/app/generated/prisma/enums";

export type TopicOption = {
  id: string;
  title: string;
  exam: Exam | null;
  kimNumber: number | null;
};

type TaskValues = {
  id?: string;
  statement?: string;
  answerType?: string;
  answer?: string | null;
  solution?: string | null;
  difficulty?: number;
  source?: string | null;
  tags?: string[];
  topicId?: string | null;
};

// Поле с живым предпросмотром формул: пишете $...$ — справа сразу результат.
function MathField({
  name,
  label,
  defaultValue,
  required = false,
  rows = 4,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          id={name}
          name={name}
          required={required}
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input font-mono text-sm"
          placeholder={"Текст и формулы: $x^2 - 5x + 6 = 0$\n$$\\frac{a}{b} = c$$"}
        />
        <div
          className="rounded-lg border-[1.5px] border-dashed border-ink/30 bg-paper px-3 py-2 text-sm"
          dangerouslySetInnerHTML={{
            __html: value
              ? renderMathHtml(value)
              : '<span style="opacity:.4">Предпросмотр</span>',
          }}
        />
      </div>
    </div>
  );
}

export function TaskForm({
  action,
  topics,
  initial = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  topics: TopicOption[];
  initial?: TaskValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const [answerType, setAnswerType] = useState(initial.answerType ?? "SHORT");

  const codifier = topics.filter((t) => t.exam !== null);
  const custom = topics.filter((t) => t.exam === null);

  return (
    <form action={formAction} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <MathField
        name="statement"
        label="Условие *"
        defaultValue={initial.statement ?? ""}
        required
        rows={5}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="answerType" className="field-label">
            Тип ответа
          </label>
          <select
            id="answerType"
            name="answerType"
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value)}
            className="input"
          >
            <option value="SHORT">Краткий (автопроверка)</option>
            <option value="DETAILED">Развёрнутый (проверяете вы)</option>
          </select>
        </div>
        <div>
          <label htmlFor="answer" className="field-label">
            Ответ {answerType === "SHORT" ? "*" : "(необязательно)"}
          </label>
          <input
            id="answer"
            name="answer"
            required={answerType === "SHORT"}
            defaultValue={initial.answer ?? ""}
            className="input"
            placeholder="42 или 0,5"
          />
        </div>
        <div>
          <label htmlFor="difficulty" className="field-label">
            Сложность
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={initial.difficulty ?? 3}
            className="input"
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} из 5
              </option>
            ))}
          </select>
        </div>
      </div>

      <MathField
        name="solution"
        label="Решение / разбор (ученику не показывается)"
        defaultValue={initial.solution ?? ""}
        rows={4}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="topicId" className="field-label">
            Тема
          </label>
          <select
            id="topicId"
            name="topicId"
            defaultValue={initial.topicId ?? ""}
            className="input"
          >
            <option value="">Без темы</option>
            {custom.length > 0 && (
              <optgroup label="Мои темы">
                {custom.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
            )}
            {(["EGE_PROF", "EGE_BASE", "OGE"] as Exam[]).map((exam) => (
              <optgroup key={exam} label={EXAM_LABELS[exam]}>
                {codifier
                  .filter((t) => t.exam === exam)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      №{t.kimNumber} · {t.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="source" className="field-label">
            Источник
          </label>
          <input
            id="source"
            name="source"
            defaultValue={initial.source ?? ""}
            className="input"
            placeholder="Ященко-2026, вар. 3"
          />
        </div>
        <div>
          <label htmlFor="tags" className="field-label">
            Теги (через запятую)
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={(initial.tags ?? []).join(", ")}
            className="input"
            placeholder="7 класс, Мерзляк"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border-[1.5px] border-[#b3492f] bg-[#fbeae5] px-3 py-2 text-sm text-[#8f3a25]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border-[1.5px] border-[#4d7a3a] bg-[#eef5e9] px-3 py-2 text-sm text-[#40662f]">
          Сохранено ✓
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill bg-butter disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : submitLabel}
      </button>
    </form>
  );
}
