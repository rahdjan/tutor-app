// Работа с облачным хранилищем фото (Vercel Blob, приватный режим).
// Файлы недоступны по прямой ссылке — их отдаёт наш сервер после проверки
// прав (см. app/api/solution-photo). В БД хранится только служебный URL.
import { put, get } from "@vercel/blob";

/** Токен хранилища: стандартное имя или с префиксом (XXX_READ_WRITE_TOKEN). */
export function getBlobToken(): string | undefined {
  return (
    process.env.BLOB_READ_WRITE_TOKEN ??
    Object.entries(process.env).find(
      ([key, value]) => key.endsWith("_READ_WRITE_TOKEN") && value,
    )?.[1]
  );
}

/** Настроено ли хранилище (токен или привязка на Vercel). */
export function blobConfigured(): boolean {
  return Boolean(getBlobToken() || process.env.BLOB_STORE_ID);
}

export async function uploadSolutionPhoto(
  path: string,
  file: File,
): Promise<string> {
  const token = getBlobToken();
  const blob = await put(path, file, {
    access: "private",
    ...(token ? { token } : {}),
  });
  return blob.url;
}

export async function readSolutionPhoto(url: string) {
  const token = getBlobToken();
  return get(url, { access: "private", ...(token ? { token } : {}) });
}
