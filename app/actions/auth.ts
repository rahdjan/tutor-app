"use server";

// Server actions авторизации: выполняются только на сервере,
// формы вызывают их напрямую через <form action={...}>.
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/access";

export type FormState = { error?: string };

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

  const invite = await prisma.invite.findUnique({ where: { code } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "Приглашение недействительно. Попросите у репетитора новую ссылку." };
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
  const student = await prisma.user.update({
    where: { email },
    data: { role: "STUDENT", tutorId: invite.tutorId },
  });
  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedById: student.id },
  });

  redirect("/student");
}

/** Выход из аккаунта. */
export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

/** Репетитор создаёт одноразовую ссылку-приглашение (действует 14 дней). */
export async function createInvite(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireTutor();
  const label = String(formData.get("label") ?? "").trim() || null;

  await prisma.invite.create({
    data: {
      code: randomBytes(9).toString("base64url"),
      label,
      tutorId: session.user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/tutor");
  return {};
}
