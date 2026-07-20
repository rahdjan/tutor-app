// Рендер условий задач: обычный текст + формулы LaTeX.
// $...$ — формула в строке, $$...$$ — выключная формула на отдельной строке.
// Возвращает готовый HTML: текст экранируется, формулы рендерит KaTeX.
// Работает и на сервере (страницы), и в браузере (живой предпросмотр).
import katex from "katex";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderKatex(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    // Совсем сломанная формула — показываем как текст, чтобы ничего не падало.
    return `<code>${escapeHtml(formula)}</code>`;
  }
}

export function renderMathHtml(source: string): string {
  // Разбираем по $$...$$ (display), затем внутри кусков — по $...$ (inline).
  const parts = source.split(/\$\$([^$]+)\$\$/g);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      out.push(renderKatex(parts[i], true));
      continue;
    }
    const inline = parts[i].split(/\$([^$\n]+)\$/g);
    for (let j = 0; j < inline.length; j++) {
      if (j % 2 === 1) {
        out.push(renderKatex(inline[j], false));
      } else {
        out.push(escapeHtml(inline[j]).replaceAll("\n", "<br/>"));
      }
    }
  }
  return out.join("");
}
