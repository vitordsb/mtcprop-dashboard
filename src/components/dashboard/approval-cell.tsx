"use client";

import { Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { actionMarkApproval, actionResetApproval } from "@/app/actions/approval-actions";

interface ApprovalCellProps {
  enrollmentId: string;
  status: "APROVADO" | "REPROVADO" | "PENDENTE";
  decidedAt: string | null;
}

export function ApprovalCell({ enrollmentId, status, decidedAt }: ApprovalCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  // Sem enrollmentId não dá pra decidir (trader não tem Enrollment no banco — só na Nelogica)
  if (!enrollmentId) {
    return <span className="text-[11px] text-[var(--app-text-subtle)]">Sem enrollment</span>;
  }

  const dateLabel = decidedAt
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(decidedAt))
    : null;

  const badge = (() => {
    if (status === "APROVADO") {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
    }
    if (status === "REPROVADO") {
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
    }
    return "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-text-subtle)]";
  })();

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition hover:brightness-95 ${badge}`}
      >
        {status === "APROVADO" && <Check className="h-3 w-3" />}
        {status === "REPROVADO" && <X className="h-3 w-3" />}
        {status}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {dateLabel && (
        <p className="mt-1 text-[10px] text-[var(--app-text-subtle)]">{dateLabel}</p>
      )}

      {open && (
        <div className="absolute left-0 z-30 mt-1 w-44 overflow-hidden rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]">
          <form
            action={async () => {
              setOpen(false);
              await actionMarkApproval(enrollmentId, "APROVADO");
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            >
              <Check className="h-4 w-4" />
              Aprovar
            </button>
          </form>
          <form
            action={async () => {
              setOpen(false);
              await actionMarkApproval(enrollmentId, "REPROVADO");
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <X className="h-4 w-4" />
              Reprovar
            </button>
          </form>
          {status !== "PENDENTE" && (
            <form
              action={async () => {
                setOpen(false);
                await actionResetApproval(enrollmentId);
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 border-t border-[var(--app-border-soft)] px-3 py-2 text-left text-[13px] font-medium text-[var(--app-text-subtle)] transition hover:bg-[var(--app-hover)]"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
