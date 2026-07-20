"use server";

// Server actions авторизации: выполняются только на сервере,
// формы вызывают их напрямую через <form action={...}>.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeRateLimit, retryHint } from "@/lib/rate-limit";

export type FormState = { error?: string; ok?: boolean };

/** Переводит ошибки Better Auth на русский. */
function authErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    switch (code) {
      case "USER_ALREADY_EXISTS":
        return "Пользователь с такой почтой уже зарегистрирован.";
      case "INVALID_EMAIL_OR_PASSWORD":
        return "Неверная почта или пароль.";
      case "INVALID_EMAIL":
        return "Похоже, в адресе почты опечатка.";
      case "PASSWORD_TOO_SHORT":
        return "Пароль слишком короткий — нужно не меньше 8 символов.";
    }
    if (error.body?.message) {
      return error.body.message;
    }
  }
  console.error("Auth error:", error);
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

function readCredentials(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

/** Регистрация репетитора: открыта для всех. */
export async function registerTutor(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { name, email, password } = readCredentials(formData);
  const consent = formData.get("consent") === "on";

  if (!name || !email) return { error: "Заполните имя и почту." };
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов." };
  if (!consent) {
    return { error: "Для регистрации нужно согласие на обработку персональных данных." };
  }

  const ip = await clientIp();
  const limit = await consumeRateLimit(`reg:ip:${ip}`, { windowSec: 3600, max: 5 });
  if (!limit.allowed) {
    return { error: `Слишком много регистраций с вашего адреса. ${retryHint(limit.retryAfterSec)}` };
  }

  try {
    // Роль не передаём: в БД по умолчанию TUTOR, с клиента её подменить нельзя.
    await auth.api.signUpEmail({
      body: { name, email, password, consentAccepted: true },
    });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  redirect("/tutor");
}

/** Вход для всех: после входа отправляем в кабинет по роли. */
export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Введите почту и пароль." };

  // Двойной ключ: по IP (защита от распределённого перебора чужих аккаунтов)
  // и по email (защита конкретного аккаунта от перебора с разных адресов).
  const ip = await clientIp();
  const byIp = await consumeRateLimit(`login:ip:${ip}`, { windowSec: 600, max: 10 });
  if (!byIp.allowed) {
    return { error: `Слишком много попыток входа. ${retryHint(byIp.retryAfterSec)}` };
  }
  const byEmail = await consumeRateLimit(`login:email:${email}`, { windowSec: 900, max: 10 });
  if (!byEmail.allowed) {
    return { error: `Слишком много попыток входа. ${retryHint(byEmail.retryAfterSec)}` };
  }

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  redirect(user?.role === "STUDENT" ? "/student" : "/tutor");
}

/** Регистрация ученика по одноразовому приглашению. */
export async function registerStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  const { name, email, password } = readCredentials(formData);
  const consent = formData.get("consent") === "on";
  const under16 = formData.get("under16") === "on";
  const parentConsent = formData.get("parentConsent") === "on";

  if (!name || !email) return { error: "Заполните имя и почту." };
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов." };
  if (!consent) {
    return { error: "Для регистрации нужно согласие на обработку персональных данных." };
  }
  if (under16 && !parentConsent) {
    return { error: "Если тебе меньше 16 лет, нужно согласие родителя." };
  }

  // До поиска приглашения — коды одноразовые с большой энтропией, перебор
  // нереален, но лимит защищает от бессмысленной нагрузки на БД.
  const ip = await clientIp();
  const limit = await consumeRateLimit(`regs:ip:${ip}`, { windowSec: 3600, max: 10 });
  if (!limit.allowed) {
    return { error: `Слишком много попыток регистрации. ${retryHint(limit.retryAfterSec)}` };
  }

  const invite = await prisma.invite.findUnique({
    where: { code },
    include: { student: { select: { userId: true } } },
  });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "Приглашение недействительно. Попросите у репетитора новую ссылку." };
  }
  if (invite.student?.userId) {
    return { error: "К этой карточке уже привязан аккаунт. Попросите у репетитора новую ссылку." };
  }

  // «Забираем» приглашение атомарно: условие usedAt: null защищает от того,
  // что по одной ссылке зарегистрируются двое одновременно.
  const claimed = await prisma.invite.updateMany({
    where: { id: invite.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { error: "Приглашение уже использовано. Попросите у репетитора новую ссылку." };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        consentAccepted: true,
        under16,
        parentConsentAccepted: parentConsent,
      },
    });
  } catch (error) {
    // Регистрация не удалась — возвращаем приглашение, чтобы ссылка осталась рабочей.
    await prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: null },
    });
    return { error: authErrorMessage(error) };
  }

  // Привязываем нового ученика к репетитору из приглашения.
  const user = await prisma.user.update({
    where: { email },
    data: { role: "STUDENT", tutorId: invite.tutorId },
  });

  // Аккаунт присоединяется к карточке ученика: либо к той, из которой
  // репетитор создал приглашение, либо к новой (для старых общих ссылок).
  if (invite.studentId) {
    await prisma.student.update({
      where: { id: invite.studentId },
      data: { userId: user.id },
    });
  } else {
    await prisma.student.create({
      data: { name, tutorId: invite.tutorId, userId: user.id },
    });
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedById: user.id },
  });

  redirect("/student");
}

/** Выход из аккаунта. */
export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
