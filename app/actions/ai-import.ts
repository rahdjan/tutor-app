"use server";

// ИИ-импорт: извлечение черновика задач из PDF/текста.
// Сохранение черновика идёт через обычный importTasksJson —
// то есть только после проверки и подтверждения репетитором.
import { requireTutor } from "@/lib/access";
import { extractTasksWithAi, type AiDraft } from "@/lib/ai-import";

export type AiImportState = {
  error?: string;
  drafts?: AiDraft[];
};

const MAX_FILE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

export async function aiExtract(
  _prev: AiImportState,
  formData: FormData,
): Promise<AiImportState> {
  await requireTutor(); // изоляция/доступ: только репетитор

  const pastedText = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE) {
      return { error: "Файл больше 8 МБ. Сожмите PDF или разбейте на части." };
    }
    const mime = file.type || "application/pdf";
    if (!ALLOWED_TYPES.includes(mime)) {
      return { error: "Поддерживаются PDF и текстовые файлы (.txt)." };
    }
    if (mime === "text/plain") {
      const text = await file.text();
      const result = await extractTasksWithAi({ text });
      return result.ok ? { drafts: result.drafts } : { error: result.error };
    }
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await extractTasksWithAi({
      file: { mimeType: mime, base64 },
    });
    return result.ok ? { drafts: result.drafts } : { error: result.error };
  }

  if (!pastedText) {
    return { error: "Загрузите PDF или вставьте текст с задачами." };
  }
  if (pastedText.length > 100_000) {
    return { error: "Текст слишком длинный — разбейте на части." };
  }
  const result = await extractTasksWithAi({ text: pastedText });
  return result.ok ? { drafts: result.drafts } : { error: result.error };
}
