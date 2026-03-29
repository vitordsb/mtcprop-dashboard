import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`glass-panel reveal rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-lg tracking-[-0.03em] text-[var(--foreground)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

