import type { ReactNode } from "react";

import { Bell } from "lucide-react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAdminInitial, requireCurrentAdminUser } from "@/lib/auth/server";
import type { CompanySnapshot } from "@/types/dashboard";

type DashboardShellProps = {
  company: CompanySnapshot;
  pageTitle: string;
  children: ReactNode;
};

export async function DashboardShell({
  company,
  pageTitle,
  children,
}: DashboardShellProps) {
  const adminUser = await requireCurrentAdminUser();

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
                <a
                  className="inline-flex items-center gap-2 font-medium text-[var(--brand)] transition hover:text-[var(--app-foreground)]"
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Site principal
                </a>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex h-screen min-w-0 min-h-0 flex-col overflow-hidden">
          <header className="theme-shell-surface z-20 flex h-20 shrink-0 items-center justify-between border-b px-6 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <h1 className="theme-title text-xl font-medium tracking-[-0.04em]">
                {pageTitle}
              </h1>
              <span className="theme-pill-soft theme-text-subtle hidden rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:inline-flex">
                Painel interno
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
              >
                <Bell className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <ProfileMenu initial={getAdminInitial(adminUser)} />
            </div>
          </header>

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
