"use client";

// Уведомление про cookie: на сайте только одна техническая cookie (сессия
// входа), для неё по закону не нужно предварительное согласие — только
// уведомление. Поэтому баннер ничего не блокирует, просто информирует.
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "cookie-consent";
const CURRENT_VALUE = "seen:v1"; // версия — если текст баннера изменится, показать заново

export function CookieBanner() {
  // На сервере localStorage недоступен, поэтому и на сервере, и при первом
  // клиентском рендере баннер скрыт — иначе будет hydration mismatch.
  // Показываем его только из useEffect, после монтирования на клиенте.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== CURRENT_VALUE) setVisible(true);
    } catch {
      setVisible(true); // localStorage недоступен (приватный режим) — покажем на всякий случай
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="print-hide fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="window-card mx-auto flex max-w-2xl flex-wrap items-center gap-3 p-4 text-sm">
        <p className="flex-1">
          Мы используем только одну техническую cookie — чтобы вы оставались
          в аккаунте между визитами. Рекламных и аналитических cookie нет.{" "}
          <Link href="/privacy" target="_blank" className="underline">
            Политика конфиденциальности
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(KEY, CURRENT_VALUE);
            } catch {
              // приватный режим — просто скроем на этот визит
            }
            setVisible(false);
          }}
          className="btn-pill bg-butter shrink-0"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
