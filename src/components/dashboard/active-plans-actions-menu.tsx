"use client";

import { MoreVertical, PlaySquare, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ActionsMenuProps {
  isActive: boolean;
  provisionAction: () => void | Promise<void>;
  cancelAction: () => void | Promise<void>;
}

export function ActivePlansActionsMenu({
  isActive,
  provisionAction,
  cancelAction,
}: ActionsMenuProps) {
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

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ações"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-subtle)] transition hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
        >
          <form
            action={async () => {
              setOpen(false);
              await provisionAction();
            }}
          >
            <button
              type="submit"
              disabled={isActive}
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            >
              <PlaySquare className="h-4 w-4" />
              Provisionar
            </button>
          </form>

          <form
            action={async () => {
              setOpen(false);
              await cancelAction();
            }}
          >
            <button
              type="submit"
              disabled={!isActive}
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <StopCircle className="h-4 w-4" />
              Cortar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
