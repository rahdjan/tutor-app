// Автопроверка кратких ответов.
// Сравниваем «по-человечески»: регистр, пробелы и запятая/точка
// в десятичных дробях не должны влиять на результат.
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll(",", ".");
}

export function checkShortAnswer(studentAnswer: string, correct: string): boolean {
  return normalizeAnswer(studentAnswer) === normalizeAnswer(correct);
}

// Итоговый балл записи: если репетитор переопределил результат вручную
// (manualScore заполнен — в том числе у SHORT, где автопроверка иногда
// ошибается), он в приоритете; иначе — автопроверка (SHORT) или 0, если
// развёрнутый ответ ещё не проверен. Единая точка правды для всех мест,
// где считаются баллы (страницы проверки, статистика, кабинет ученика).
export function effectiveScore(entry: {
  autoScore: number | null;
  manualScore: number | null;
}): number {
  return entry.manualScore ?? entry.autoScore ?? 0;
}
