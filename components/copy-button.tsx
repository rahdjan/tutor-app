"use client";

import { useState } from "react";

// Кнопка «скопировать ссылку» — нужен клиентский компонент,
// потому что доступ к буферу обмена есть только в браузере.
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="btn-pill bg-paper px-3 py-1 text-xs"
    >
      {copied ? "Скопировано ✓" : "Скопировать"}
    </button>
  );
}
