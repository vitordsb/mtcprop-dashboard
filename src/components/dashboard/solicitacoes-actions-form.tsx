"use client";

import { Check, ChevronDown, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  actionAprovarSolicitacao,
  actionConcluirSolicitacao,
  actionRejeitarSolicitacao,
  actionResetSolicitacao,
} from "@/app/actions/solicitacoes-actions";

interface Props {
  id: string;
  status: "PENDENTE" | "APROVADA" | "REJEITADA" | "CONCLUIDA";
}

export function SolicitacoesActionsForm({ id, status }: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNotes(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowNotes(false);
      }
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
        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)]"
      >
        Decidir
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]">
          {status === "PENDENTE" && (
            <>
              {showNotes && (
                <div className="border-b border-[var(--app-border-soft)] p-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-text-subtle)]">
                    Observação (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Motivo, contexto, decisão..."
                    className="mt-1 w-full rounded-[8px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                  />
                </div>
              )}

              <form
                action={async () => {
                  setOpen(false);
                  setShowNotes(false);
                  await actionAprovarSolicitacao(id, notes);
                  setNotes("");
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
                  setShowNotes(false);
                  await actionRejeitarSolicitacao(id, notes);
                  setNotes("");
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <X className="h-4 w-4" />
                  Rejeitar
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="flex w-full items-center gap-2 border-t border-[var(--app-border-soft)] px-3 py-2 text-left text-[12px] text-[var(--app-text-subtle)] transition hover:bg-[var(--app-hover)]"
              >
                {showNotes ? "Ocultar observação" : "Adicionar observação..."}
              </button>
            </>
          )}

          {status === "APROVADA" && (
            <>
              <form
                action={async () => {
                  setOpen(false);
                  await actionConcluirSolicitacao(id);
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--brand)] transition hover:bg-[var(--app-hover)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Marcar como concluída
                </button>
              </form>
              <form
                action={async () => {
                  setOpen(false);
                  await actionResetSolicitacao(id);
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 border-t border-[var(--app-border-soft)] px-3 py-2 text-left text-[13px] text-[var(--app-text-subtle)] transition hover:bg-[var(--app-hover)]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Voltar para pendente
                </button>
              </form>
            </>
          )}

          {(status === "REJEITADA" || status === "CONCLUIDA") && (
            <form
              action={async () => {
                setOpen(false);
                await actionResetSolicitacao(id);
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--app-text-subtle)] transition hover:bg-[var(--app-hover)]"
              >
                <RotateCcw className="h-4 w-4" />
                Voltar para pendente
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
