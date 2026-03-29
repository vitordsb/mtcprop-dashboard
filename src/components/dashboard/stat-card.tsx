import type { ReactNode } from "react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import type { MetricTone } from "@/types/dashboard";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
  hint: string;
  tone: MetricTone;
};

const toneMap: Record<MetricTone, "brand" | "neutral" | "warning"> = {
  brand: "brand",
  neutral: "neutral",
  warning: "warning",
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  hint,
  tone,
}: StatCardProps) {
  return (
    <article className="glass-panel reveal rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(69,225,95,0.18)] bg-[rgba(69,225,95,0.09)] text-[var(--brand)]">
          {icon}
        </span>
        <StatusBadge tone={toneMap[tone]}>{trend}</StatusBadge>
      </div>
      <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </p>
      <strong className="mt-3 block text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
        {value}
      </strong>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{hint}</p>
    </article>
  );
}

