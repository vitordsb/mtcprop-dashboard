import { Bell } from "lucide-react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCompanySnapshot } from "@/lib/company-snapshot";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[14px] bg-[var(--app-surface-soft)] ${className}`} />;
}

export function DashboardShellLoading({
  pageTitle = "Carregando",
  variant = "table",
}: {
  pageTitle?: string;
  variant?: "table" | "detail" | "overview";
}) {
  const company = getCompanySnapshot();

  return (
    <div className="theme-page h-screen overflow-hidden">
      <div className="grid h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="theme-shell-surface flex h-screen flex-col overflow-hidden border-b lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
            <MtcpropMark align="left" size="compact" variant="symbol" />
          </div>

          <SidebarNav />

          <div className="hidden shrink-0 border-t border-[var(--app-border-soft)] px-6 py-5 lg:block">
            <div className="theme-card rounded-lg border border-[var(--app-border-soft)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                Ambiente atual
              </p>
              <div className="mt-3 space-y-2 text-sm text-[var(--app-foreground)]">
                <p>{company.environment}</p>
                <p className="text-[var(--app-muted)]">{company.deploymentTarget}</p>
                <span className="inline-flex items-center gap-2 font-medium text-[var(--brand)]">
                  Site principal
                </span>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex h-screen min-w-0 min-h-0 flex-col overflow-hidden">
          <header className="theme-shell-surface z-20 flex h-20 shrink-0 items-center justify-between border-b px-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div>
                <div className="theme-title text-xl font-medium tracking-[-0.04em]">{pageTitle}</div>
              </div>
              <span className="theme-pill-soft theme-text-subtle hidden rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:inline-flex">
                Painel interno
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[rgba(69,225,95,0.2)] bg-[#071108] text-sm font-semibold text-white">
                M
              </div>
            </div>
          </header>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                  <SkeletonBlock className="h-5 w-36" />
                  <SkeletonBlock className="h-11 w-64" />
                  <SkeletonBlock className="h-4 w-80 max-w-full" />
                </div>
                <div className="flex gap-3">
                  <SkeletonBlock className="h-11 w-28" />
                  <SkeletonBlock className="h-11 w-36" />
                </div>
              </div>

              {variant === "detail" ? (
                <>
                  <div className="theme-card rounded-[24px] p-6">
                    <div className="grid gap-6 md:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                          <SkeletonBlock className="h-4 w-24" />
                          <SkeletonBlock className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="theme-card rounded-[24px] p-6">
                    <div className="grid gap-6 md:grid-cols-3">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                          <SkeletonBlock className="h-4 w-20" />
                          <SkeletonBlock className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="theme-card overflow-hidden rounded-[24px]">
                  <div className="flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
                    <div className="space-y-3">
                      <SkeletonBlock className="h-8 w-44" />
                      <SkeletonBlock className="h-4 w-32" />
                    </div>
                    <div className="flex gap-3">
                      <SkeletonBlock className="h-10 w-28" />
                      <SkeletonBlock className="h-10 w-32" />
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-4 pb-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-4 w-24" />
                      ))}
                    </div>

                    <div className="space-y-3">
                      {Array.from({ length: variant === "overview" ? 4 : 8 }).map((_, index) => (
                        <SkeletonBlock key={index} className="h-16 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
