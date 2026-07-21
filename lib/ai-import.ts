// ИИ-извлечение задач из PDF, изображения или текста.
// Работает через OpenAI-совместимый API (у нас — агрегатор AITunnel,
// модель Gemini 2.5 Flash). Всё настраивается переменными окружения:
//   AI_API_KEY  — ключ (обязателен)
//   AI_BASE_URL — адрес API (по умолчанию https://api.aitunnel.ru/v1)
//   AI_MODEL    — модель (по умолчанию gemini-2.5-flash)
// Результат — ЧЕРНОВИК, который репетитор проверяет перед сохранением.
//
// Модуль намеренно не знает про Prisma/БД — список тем для классификации
// передаётся параметром (его достаёт вызывающий код, app/actions/ai-import.ts).
import { OTHER_TOPIC_TITLE } from "@/lib/curriculum-topics";

function buildPrompt(topics: string[]): string {
  const topicList = topics.map((t) => `- ${t}`).join("\n");
  return `Ты извлекаешь математические задачи из материалов репетитора (домашние работы, варианты, сборники).

Верни СТРОГО JSON-объект вида {"tasks": [...]} без каких-либо пояснений и без markdown-ограждений. Формат каждой задачи в массиве tasks:
{
  "statement": "полное условие; все формулы в LaTeX между $...$, выключные — между $$...$$",
  "answer_type": "SHORT" — если ответ это число/короткое выражение, иначе "DETAILED",
  "answer": "ответ, если он есть в материале или очевиден; иначе null",
  "solution": "решение, если приведено в материале; иначе null",
  "difficulty": целое 1-5 (1 — устный счёт, 3 — типовая, 5 — олимпиадная),
  "topic": "тема из списка ниже — см. правило классификации",
  "tags": ["короткие доп. ключевые слова по содержанию, на русском, 1-3 штуки"]
}

Правила:
- Каждая задача материала — отдельный элемент массива. Номера заданий в текст не включай.
- Ничего не выдумывай: если ответа/решения нет — null.
- Дроби, степени, корни — обязательно в LaTeX: $\\frac{1}{2}$, $x^2$, $\\sqrt{3}$.
- ВАЖНО: внутри JSON-строк каждый обратный слэш LaTeX удваивается: "$\\\\frac{1}{2}$".
- Классификация: поле "topic" заполняй СТРОГО одним из заголовков списка ниже
  (скопируй точный текст, ничего от себя не добавляй). Если ни одна тема
  из списка явно не подходит к задаче, укажи "Другое". Список — это
  темы школьной программы по классам, используется для точной сортировки
  задач при сборке рабочих листов, поэтому выбирай ближайшую по смыслу
  тему, а не самую общую.
- Если в материале нет задач, верни {"tasks": []}.

Список тем для классификации:
${topicList}`;
}

export type AiDraft = {
  statement: string;
  answer_type: "SHORT" | "DETAILED";
  answer: string | null;
  solution: string | null;
  difficulty: number;
  topic: string;
  tags: string[];
};

export type AiExtractResult =
  | { ok: true; drafts: AiDraft[] }
  | { ok: false; error: string };

type ContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } }
  | { type: "image_url"; image_url: { url: string } };

export async function extractTasksWithAi(input: {
  text?: string;
  file?: { mimeType: string; base64: string };
  topics: string[];
}): Promise<AiExtractResult> {
  const key = process.env.AI_API_KEY;
  if (!key) {
    return { ok: false, error: "AI_API_KEY не настроен в переменных окружения." };
  }
  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.aitunnel.ru/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";

  const content: ContentPart[] = [{ type: "text", text: buildPrompt(input.topics) }];
  if (input.file) {
    const dataUrl = `data:${input.file.mimeType};base64,${input.file.base64}`;
    // PDF идёт как "file" (формат OpenAI-совместимых API для документов),
    // изображения — как "image_url" (стандартный vision-формат): это два
    // разных типа контент-парта, модель их не взаимозаменяет.
    if (input.file.mimeType.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      content.push({
        type: "file",
        file: { filename: "material.pdf", file_data: dataUrl },
      });
    }
  }
  if (input.text) {
    content.push({ type: "text", text: `Материал:\n\n${input.text}` });
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content }],
        temperature: 0.1,
        max_tokens: 30000,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    return { ok: false, error: "Не удалось связаться с AI-сервисом. Проверьте интернет." };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, error: "AI-сервис отклонил ключ — проверьте AI_API_KEY." };
  }
  if (response.status === 402) {
    return { ok: false, error: "На балансе AI-сервиса закончились средства." };
  }
  if (response.status === 429) {
    return { ok: false, error: "Превышен лимит запросов AI-сервиса. Подождите минуту." };
  }
  if (!response.ok) {
    return { ok: false, error: `Ошибка AI-сервиса (${response.status}). Попробуйте позже.` };
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return { ok: false, error: "Модель вернула пустой ответ. Попробуйте ещё раз." };

  // На случай, если модель обернула JSON в ```-ограждение
  const cleaned = raw.replace(/^```(json)?/m, "").replace(/```\s*$/m, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Частая беда: LaTeX с одинарным слэшем ломает экранирование JSON
    // ("\sqrt" — некорректный escape). Чиним: экранируем недопустимые слэши.
    try {
      parsed = JSON.parse(cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
    } catch {
      return { ok: false, error: "Не удалось разобрать ответ модели. Попробуйте ещё раз." };
    }
  }
  // Принимаем и {"tasks": [...]}, и просто [...] — модели отвечают по-разному.
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { tasks?: unknown })?.tasks)
      ? ((parsed as { tasks: unknown[] }).tasks)
      : null;
  if (!list) {
    return { ok: false, error: "Модель вернула не массив задач. Попробуйте ещё раз." };
  }

  // Сверяем topic со списком, который реально передали модели — не даём
  // мусорным/выдуманным заголовкам просочиться дальше в резолв темы.
  const knownTopics = new Set(input.topics.map((t) => t.trim().toLowerCase()));

  const drafts: AiDraft[] = [];
  for (const item of list as Record<string, unknown>[]) {
    if (typeof item?.statement !== "string" || !item.statement.trim()) continue;
    const difficultyNum = Number(item.difficulty);
    const topicRaw = typeof item.topic === "string" ? item.topic.trim() : "";
    const topic = knownTopics.has(topicRaw.toLowerCase()) ? topicRaw : OTHER_TOPIC_TITLE;
    drafts.push({
      statement: item.statement.trim(),
      answer_type: item.answer_type === "DETAILED" ? "DETAILED" : "SHORT",
      answer:
        typeof item.answer === "string" && item.answer.trim()
          ? item.answer.trim()
          : null,
      solution:
        typeof item.solution === "string" && item.solution.trim()
          ? item.solution.trim()
          : null,
      difficulty:
        Number.isInteger(difficultyNum) && difficultyNum >= 1 && difficultyNum <= 5
          ? difficultyNum
          : 3,
      topic,
      tags: Array.isArray(item.tags)
        ? item.tags.filter((t): t is string => typeof t === "string").slice(0, 5)
        : [],
    });
  }
  return { ok: true, drafts };
}
