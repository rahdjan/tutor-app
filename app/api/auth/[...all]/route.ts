// Все HTTP-эндпоинты Better Auth (вход, регистрация, сессия, выход)
// обслуживаются одним обработчиком по адресу /api/auth/*.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
