const windowDots = (
  <div className="window-bar">
    <span className="window-dot bg-[#e0654a]" />
    <span className="window-dot bg-butter" />
    <span className="window-dot bg-[#7a9e63]" />
  </div>
);

const pains = [
  "Задачи разбросаны по PDF, скриншотам и старым тетрадям",
  "Проверка домашних работ съедает весь вечер",
  "Расписание и оплаты — в заметках телефона",
  "Непонятно, насколько ученик реально готов к экзамену",
];

const features = [
  {
    title: "Банк задач",
    text: "Свои задачи с формулами (LaTeX), сложностью, тегами и источником. Импорт и экспорт в JSON.",
  },
  {
    title: "Программа по кодификатору",
    text: "ЕГЭ профиль и база, ОГЭ — темы по кодификатору ФИПИ, даты, статусы освоения и прогресс ученика.",
  },
  {
    title: "Тесты онлайн",
    text: "Ученик решает в своём кабинете: короткие ответы проверяются автоматически, развёрнутые — вами.",
  },
  {
    title: "Рабочие листы",
    text: "Не только ЕГЭ и ОГЭ: листы для любого класса и учебника, с версией для печати.",
  },
  {
    title: "ИИ-импорт задач",
    text: "Загрузите PDF или текст — черновик задач соберётся сам. Вы проверяете и подтверждаете: модель может ошибаться.",
  },
  {
    title: "Расписание и оплаты",
    text: "Уроки, пакеты занятий, баланс и напоминания — в одном месте вместо блокнота.",
  },
];

const steps = [
  {
    n: "01",
    title: "Зарегистрируйтесь",
    text: "Создайте кабинет репетитора и пригласите учеников по одноразовой ссылке.",
  },
  {
    n: "02",
    title: "Соберите программу",
    text: "Выберите темы из кодификатора и наполните банк задач — вручную, из JSON или через ИИ-импорт.",
  },
  {
    n: "03",
    title: "Выдавайте задания",
    text: "Соберите тест или рабочий лист из банка и назначьте ученику со сроком.",
  },
  {
    n: "04",
    title: "Следите за прогрессом",
    text: "Автопроверка коротких ответов, ваши баллы за развёрнутые, статистика по темам.",
  },
];

const audience = [
  "Готовите к ЕГЭ — профильному или базовому",
  "Готовите к ОГЭ",
  "Ведёте 5–9 классы по своим материалам",
  "Занимаетесь онлайн и хотите меньше рутины",
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      {/* Верхняя панель */}
      <header className="flex items-center justify-between py-5">
        <div className="text-lg font-bold tracking-tight">
          Платформа.
          <span className="font-serif italic font-medium">Репетитор</span>
        </div>
        <nav className="flex items-center gap-3">
          <a href="/login" className="btn-pill bg-paper hidden sm:inline-flex">
            Войти
          </a>
          <a href="/register" className="btn-pill bg-butter">
            Начать
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <p className="eyebrow mb-5 text-muted">
            • Платформа для репетиторов по математике
          </p>
          <h1 className="text-4xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Вся подготовка к{" "}
            <span className="font-serif italic font-medium normal-case">
              ЕГЭ и ОГЭ
            </span>{" "}
            — в одном кабинете
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Банк задач, программа по кодификатору ФИПИ, онлайн-тесты,
            расписание и оплаты — вместо папок, чатов и заметок.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/register" className="btn-pill bg-butter">
              Я репетитор →
            </a>
            <a href="/login" className="btn-pill bg-paper">
              Я ученик
            </a>
          </div>
        </div>

        {/* Декоративная панель с задачей */}
        <div className="stripes relative rounded-3xl bg-cocoa p-6 sm:p-10">
          <div className="window-card rotate-[-1.5deg]">
            {windowDots}
            <div className="p-5">
              <p className="eyebrow text-muted">Задача · ЕГЭ профиль · №12</p>
              <p className="mt-3 text-lg font-semibold">
                Решите уравнение: x² − 5x + 6 = 0
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full border border-line/40 px-3 py-1 text-sm">
                  Ответ: 2; 3
                </span>
                <span className="rounded-full bg-butter px-3 py-1 text-sm font-semibold">
                  ✓ автопроверка
                </span>
              </div>
            </div>
          </div>
          <div className="window-card mt-5 ml-8 rotate-[1.2deg]">
            {windowDots}
            <div className="p-5">
              <p className="eyebrow text-muted">Прогресс ученика</p>
              <p className="mt-2 text-sm text-muted">
                Тема «Квадратные уравнения»
              </p>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-line/60 bg-cream">
                <div className="h-full w-2/3 rounded-full bg-butter" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Боли */}
      <section className="grid gap-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
        <div className="dashed-frame flex flex-col justify-between p-7">
          <p className="eyebrow text-muted">• Знакомо?</p>
          <p className="mt-10 font-serif text-3xl italic leading-snug sm:text-4xl">
            Если это про вашу
            <br />
            работу — платформа
            <br />
            для вас
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {pains.map((pain, i) => (
            <div
              key={pain}
              className={`window-card max-w-xl ${i % 2 === 1 ? "self-end" : ""}`}
            >
              <div className="flex items-center justify-between gap-4 p-4">
                <p className="font-medium">{pain}</p>
                <span className="eyebrow shrink-0 text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section className="stripes rounded-3xl bg-cocoa px-6 py-12 text-cream sm:px-10 lg:py-16">
        <p className="eyebrow text-center text-butter">• Что умеет платформа</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-center font-serif text-3xl italic leading-snug text-butter sm:text-4xl">
          Всё для системной подготовки
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="window-card text-ink">
              {windowDots}
              <div className="p-5">
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-12 lg:py-16">
        <p className="eyebrow text-muted">• Как это работает</p>
        <h2 className="mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          Четыре шага{" "}
          <span className="font-serif italic font-medium normal-case">
            от хаоса к системе
          </span>
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="dashed-frame p-6">
              <p className="font-serif text-3xl italic text-muted">{s.n}</p>
              <h3 className="mt-4 font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Кому подойдёт */}
      <section className="stripes rounded-3xl bg-cocoa px-6 py-12 text-cream sm:px-10 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-butter">• Кому подойдёт</p>
            <h2 className="mt-4 font-serif text-3xl italic leading-snug text-butter sm:text-4xl">
              Платформа для вас, если вы…
            </h2>
            <a
              href="/register"
              className="btn-pill mt-8 bg-butter text-ink shadow-[3px_3px_0_0_#f1eee8] hover:shadow-[1px_1px_0_0_#f1eee8]"
            >
              Начать →
            </a>
          </div>
          <ul className="flex flex-col gap-3">
            {audience.map((a) => (
              <li
                key={a}
                className="flex items-center justify-between gap-4 rounded-full border border-cream/40 px-5 py-3"
              >
                <span>{a}</span>
                <span className="text-butter">✓</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Футер */}
      <footer className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted">
        <p className="font-bold text-ink">
          Платформа.
          <span className="font-serif italic font-medium">Репетитор</span>
        </p>
        <p>
          Бета-версия: платформа активно разрабатывается. Регистрация откроется
          позже.
        </p>
        <p>© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
