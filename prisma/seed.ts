// Сид кодификатора: темы по номерам заданий КИМ 2026 (структура без изменений
// с 2025 года). Источники: спецификации ФИПИ в пересказе профильных сайтов
// (sdamgia, синергия, vpr-ege) — сверено в июле 2026.
// Запуск: npx prisma db seed (см. prisma.config.ts).
// Повторный запуск безопасен: темы ищутся по (exam, kimNumber) и обновляются.
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { OTHER_TOPIC_TITLE } from "../lib/curriculum-topics.ts";

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

// Общая школьная программа 5–11 класс (алгебра/геометрия), не привязана
// к ЕГЭ/ОГЭ — источник: стандартная российская школьная программа.
// tutorId остаётся null (видна всем репетиторам), exam остаётся null.
type SchoolTopic = { section?: "Алгебра" | "Геометрия"; title: string };

const GRADE_5: SchoolTopic[] = [
  { title: "Натуральные числа и действия с ними" },
  { title: "Обыкновенные дроби" },
  { title: "Десятичные дроби" },
  { title: "Проценты" },
  { title: "Шкалы и координаты (координатный луч)" },
  { title: "Углы и их измерение" },
  { title: "Площадь прямоугольника, объём прямоугольного параллелепипеда" },
];

const GRADE_6: SchoolTopic[] = [
  { title: "Делимость чисел (признаки делимости, НОД, НОК)" },
  { title: "Сложение, вычитание, умножение и деление дробей" },
  { title: "Отношения и пропорции" },
  { title: "Масштаб" },
  { title: "Положительные и отрицательные числа" },
  { title: "Рациональные числа и действия с ними" },
  { title: "Координатная плоскость" },
  { title: "Решение простейших уравнений" },
];

const GRADE_7: SchoolTopic[] = [
  { section: "Алгебра", title: "Буквенные выражения и тождества" },
  { section: "Алгебра", title: "Линейные уравнения с одной переменной" },
  { section: "Алгебра", title: "Линейная функция и её график" },
  { section: "Алгебра", title: "Степень с натуральным показателем" },
  { section: "Алгебра", title: "Одночлены и многочлены" },
  { section: "Алгебра", title: "Формулы сокращённого умножения" },
  { section: "Алгебра", title: "Системы линейных уравнений" },
  { section: "Геометрия", title: "Точка, прямая, отрезок, луч, угол" },
  { section: "Геометрия", title: "Смежные и вертикальные углы" },
  { section: "Геометрия", title: "Треугольник и признаки равенства треугольников" },
  { section: "Геометрия", title: "Параллельные прямые и их признаки" },
  { section: "Геометрия", title: "Соотношения между сторонами и углами треугольника" },
  { section: "Геометрия", title: "Прямоугольный треугольник" },
];

const GRADE_8: SchoolTopic[] = [
  { section: "Алгебра", title: "Рациональные дроби и действия с ними" },
  { section: "Алгебра", title: "Квадратные корни и их свойства" },
  { section: "Алгебра", title: "Квадратные уравнения (дискриминант, теорема Виета)" },
  { section: "Алгебра", title: "Дробно-рациональные уравнения" },
  { section: "Алгебра", title: "Числовые неравенства и неравенства с одной переменной" },
  { section: "Алгебра", title: "Степень с целым показателем" },
  { section: "Геометрия", title: "Четырёхугольники (параллелограмм, прямоугольник, ромб, квадрат, трапеция)" },
  { section: "Геометрия", title: "Средняя линия треугольника и трапеции" },
  { section: "Геометрия", title: "Площади фигур" },
  { section: "Геометрия", title: "Теорема Пифагора" },
  { section: "Геометрия", title: "Подобие треугольников" },
  { section: "Геометрия", title: "Окружность, касательная, вписанные и центральные углы" },
];

const GRADE_9: SchoolTopic[] = [
  { section: "Алгебра", title: "Квадратичная функция и её график" },
  { section: "Алгебра", title: "Функции вида y = xⁿ, корень n-й степени" },
  { section: "Алгебра", title: "Уравнения и неравенства с одной переменной" },
  { section: "Алгебра", title: "Системы уравнений" },
  { section: "Алгебра", title: "Арифметическая и геометрическая прогрессии" },
  { section: "Алгебра", title: "Элементы статистики и теории вероятностей" },
  { section: "Геометрия", title: "Векторы и действия с ними" },
  { section: "Геометрия", title: "Метод координат" },
  { section: "Геометрия", title: "Теорема синусов и теорема косинусов" },
  { section: "Геометрия", title: "Соотношения в треугольнике" },
  { section: "Геометрия", title: "Длина окружности и площадь круга" },
  { section: "Геометрия", title: "Правильные многоугольники" },
  { section: "Геометрия", title: "Движения (симметрия, поворот, параллельный перенос)" },
];

const GRADE_10: SchoolTopic[] = [
  { section: "Алгебра", title: "Тригонометрические функции, основные тождества" },
  { section: "Алгебра", title: "Формулы приведения, сложения, двойного угла" },
  { section: "Алгебра", title: "Тригонометрические уравнения и неравенства" },
  { section: "Алгебра", title: "Предел и непрерывность" },
  { section: "Алгебра", title: "Производная и её геометрический смысл" },
  { section: "Алгебра", title: "Применение производной к исследованию функций" },
  { section: "Геометрия", title: "Аксиомы стереометрии" },
  { section: "Геометрия", title: "Параллельность прямых и плоскостей" },
  { section: "Геометрия", title: "Перпендикулярность прямых и плоскостей" },
  { section: "Геометрия", title: "Двугранный угол" },
  { section: "Геометрия", title: "Многогранники (призма, пирамида, параллелепипед)" },
];

const GRADE_11: SchoolTopic[] = [
  { section: "Алгебра", title: "Первообразная и интеграл" },
  { section: "Алгебра", title: "Степенная, показательная и логарифмическая функции" },
  { section: "Алгебра", title: "Показательные и логарифмические уравнения и неравенства" },
  { section: "Алгебра", title: "Свойства логарифмов" },
  { section: "Алгебра", title: "Элементы комбинаторики, статистики и теории вероятностей" },
  { section: "Геометрия", title: "Координаты и векторы в пространстве" },
  { section: "Геометрия", title: "Тела вращения (цилиндр, конус, шар и сфера)" },
  { section: "Геометрия", title: "Площади поверхностей" },
  { section: "Геометрия", title: "Объёмы тел (призмы, пирамиды, цилиндра, конуса, шара)" },
];

const SCHOOL_PROGRAM: { grade: number; topics: SchoolTopic[] }[] = [
  { grade: 5, topics: GRADE_5 },
  { grade: 6, topics: GRADE_6 },
  { grade: 7, topics: GRADE_7 },
  { grade: 8, topics: GRADE_8 },
  { grade: 9, topics: GRADE_9 },
  { grade: 10, topics: GRADE_10 },
  { grade: 11, topics: GRADE_11 },
];

async function seedSchoolTopics() {
  let count = 0;
  for (const { grade, topics } of SCHOOL_PROGRAM) {
    for (const [i, t] of topics.entries()) {
      const data = {
        title: t.title,
        exam: null,
        grade,
        section: t.section ?? null,
        order: i + 1,
      };
      const existing = await prisma.topic.findFirst({
        where: { tutorId: null, exam: null, grade, title: t.title },
      });
      if (existing) {
        await prisma.topic.update({ where: { id: existing.id }, data });
      } else {
        await prisma.topic.create({ data });
      }
      count++;
    }
  }

  // Общий разбор-катчер: не привязан к классу, один на весь кодификатор.
  const otherData = { title: OTHER_TOPIC_TITLE, exam: null, grade: null, section: null };
  const existingOther = await prisma.topic.findFirst({
    where: { tutorId: null, exam: null, grade: null, title: OTHER_TOPIC_TITLE },
  });
  if (existingOther) {
    await prisma.topic.update({ where: { id: existingOther.id }, data: otherData });
  } else {
    await prisma.topic.create({ data: otherData });
  }
  count++;

  console.log(`Школьная программа 5–11 класс: ${count} тем (включая «${OTHER_TOPIC_TITLE}»)`);
}

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
  await seedSchoolTopics();
  const total = await prisma.topic.count();
  console.log(`Всего тем в базе: ${total}`);
}

main().finally(() => prisma.$disconnect());
