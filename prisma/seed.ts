// Сид кодификатора: темы по номерам заданий КИМ 2026 (структура без изменений
// с 2025 года). Источники: спецификации ФИПИ в пересказе профильных сайтов
// (sdamgia, синергия, vpr-ege) — сверено в июле 2026.
// Запуск: npx prisma db seed (см. prisma.config.ts).
// Повторный запуск безопасен: темы ищутся по (exam, kimNumber) и обновляются.
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type SeedTopic = { n: number; title: string; detailed?: boolean };

// ЕГЭ профильный уровень: 19 заданий, 1–12 краткий ответ, 13–19 развёрнутый
const EGE_PROF: SeedTopic[] = [
  { n: 1, title: "Планиметрия" },
  { n: 2, title: "Векторы" },
  { n: 3, title: "Стереометрия" },
  { n: 4, title: "Начала теории вероятностей" },
  { n: 5, title: "Вероятности сложных событий" },
  { n: 6, title: "Простейшие уравнения" },
  { n: 7, title: "Вычисления и преобразования выражений" },
  { n: 8, title: "Производная и первообразная" },
  { n: 9, title: "Задачи с прикладным содержанием" },
  { n: 10, title: "Текстовые задачи" },
  { n: 11, title: "Графики функций" },
  { n: 12, title: "Исследование функций (производная)" },
  { n: 13, title: "Уравнение (тригонометрия, логарифмы, показательные)", detailed: true },
  { n: 14, title: "Стереометрическая задача", detailed: true },
  { n: 15, title: "Неравенство", detailed: true },
  { n: 16, title: "Финансовая математика (экономическая задача)", detailed: true },
  { n: 17, title: "Планиметрическая задача", detailed: true },
  { n: 18, title: "Задача с параметром", detailed: true },
  { n: 19, title: "Числа и их свойства", detailed: true },
];

// ЕГЭ базовый уровень: 21 задание, все с кратким ответом
const EGE_BASE: SeedTopic[] = [
  { n: 1, title: "Простейшие текстовые задачи" },
  { n: 2, title: "Размеры и единицы измерения" },
  { n: 3, title: "Чтение графиков и диаграмм" },
  { n: 4, title: "Преобразование выражений (вычисление по формуле)" },
  { n: 5, title: "Начала теории вероятностей" },
  { n: 6, title: "Выбор оптимального варианта" },
  { n: 7, title: "Анализ графиков и таблиц" },
  { n: 8, title: "Анализ утверждений" },
  { n: 9, title: "Площадь" },
  { n: 10, title: "Прикладная планиметрия" },
  { n: 11, title: "Прикладная стереометрия" },
  { n: 12, title: "Планиметрия" },
  { n: 13, title: "Стереометрия" },
  { n: 14, title: "Действия с дробями" },
  { n: 15, title: "Текстовые задачи на проценты" },
  { n: 16, title: "Вычисления и преобразования" },
  { n: 17, title: "Уравнения" },
  { n: 18, title: "Числа и неравенства" },
  { n: 19, title: "Цифровая запись числа" },
  { n: 20, title: "Текстовая задача" },
  { n: 21, title: "Задачи на смекалку" },
];

// ОГЭ: 25 заданий, 1–19 краткий ответ, 20–25 развёрнутый
const OGE: SeedTopic[] = [
  { n: 1, title: "Практико-ориентированная задача (лист 1)" },
  { n: 2, title: "Практико-ориентированная задача (лист 2)" },
  { n: 3, title: "Практико-ориентированная задача (лист 3)" },
  { n: 4, title: "Практико-ориентированная задача (лист 4)" },
  { n: 5, title: "Практико-ориентированная задача (лист 5)" },
  { n: 6, title: "Числа и вычисления" },
  { n: 7, title: "Числовые неравенства, координатная прямая" },
  { n: 8, title: "Степени и корни, алгебраические выражения" },
  { n: 9, title: "Уравнения и системы уравнений" },
  { n: 10, title: "Статистика и вероятности" },
  { n: 11, title: "Графики функций" },
  { n: 12, title: "Расчёты по формулам" },
  { n: 13, title: "Неравенства и системы неравенств" },
  { n: 14, title: "Прогрессии" },
  { n: 15, title: "Треугольники, четырёхугольники, многоугольники" },
  { n: 16, title: "Окружность, круг и их элементы" },
  { n: 17, title: "Площади фигур" },
  { n: 18, title: "Фигуры на квадратной решётке" },
  { n: 19, title: "Анализ геометрических утверждений" },
  { n: 20, title: "Алгебраические выражения, уравнения, неравенства", detailed: true },
  { n: 21, title: "Текстовая задача", detailed: true },
  { n: 22, title: "Функции и графики", detailed: true },
  { n: 23, title: "Геометрическая задача на вычисление", detailed: true },
  { n: 24, title: "Геометрическая задача на доказательство", detailed: true },
  { n: 25, title: "Геометрическая задача повышенной сложности", detailed: true },
];

async function seedExam(exam: "EGE_PROF" | "EGE_BASE" | "OGE", topics: SeedTopic[]) {
  for (const t of topics) {
    const section = t.detailed
      ? "Часть 2 (развёрнутый ответ)"
      : "Часть 1 (краткий ответ)";
    const data = {
      title: t.title,
      exam,
      section,
      kimNumber: t.n,
      order: t.n,
    };
    const existing = await prisma.topic.findFirst({
      where: { exam, kimNumber: t.n },
    });
    if (existing) {
      await prisma.topic.update({ where: { id: existing.id }, data });
    } else {
      await prisma.topic.create({ data });
    }
  }
  console.log(`${exam}: ${topics.length} тем`);
}

async function main() {
  await seedExam("EGE_PROF", EGE_PROF);
  await seedExam("EGE_BASE", EGE_BASE);
  await seedExam("OGE", OGE);
  const total = await prisma.topic.count();
  console.log(`Всего тем в базе: ${total}`);
}

main().finally(() => prisma.$disconnect());
