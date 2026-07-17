"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-pill bg-butter"
    >
      🖨 Распечатать
    </button>
  );
}
