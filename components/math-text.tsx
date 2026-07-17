import { renderMathHtml } from "@/lib/latex";

// Текст с формулами LaTeX. HTML безопасен: текст экранируется в renderMathHtml.
export function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMathHtml(text) }}
    />
  );
}
