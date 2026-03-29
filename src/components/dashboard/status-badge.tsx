import type { ReactNode } from "react";

type StatusBadgeProps = {
  tone: "brand" | "neutral" | "warning" | "danger";
  children: ReactNode;
};

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  brand:
    "border-[rgba(69,225,95,0.32)] bg-[rgba(69,225,95,0.14)] text-[var(--brand)]",
  neutral:
    "border-white/10 bg-white/5 text-[rgba(242,255,243,0.82)]",
  warning:
    "border-[rgba(245,200,107,0.28)] bg-[rgba(245,200,107,0.12)] text-[var(--warning)]",
  danger:
    "border-[rgba(255,123,123,0.28)] bg-[rgba(255,123,123,0.12)] text-[var(--danger)]",
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

