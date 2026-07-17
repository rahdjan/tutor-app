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
