import type { ReactNode } from "react";

import { Bell, Moon } from "lucide-react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
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
    <div className="min-h-screen bg-[#f3f6fa] text-[#071108]">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[#e4ebe5] bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="border-b border-[#edf2ed] px-6 py-7">
            <MtcpropMark align="left" size="compact" />
          </div>

          <SidebarNav />

          <div className="hidden border-t border-[#edf2ed] px-6 py-5 lg:block">
            <div
              className="relative overflow-hidden rounded-[20px] border border-[rgba(69,225,95,0.14)] bg-[#071108] p-4 text-white"
              style={{
                backgroundImage:
                  "linear-gradient(180deg,rgba(4,10,5,0.2),rgba(4,10,5,0.86)), url('/brand/mtcprop-control-room.jpg')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(69,225,95,0.16),transparent_48%)]" />
              <div className="relative">
                <MtcpropMark theme="dark" align="left" size="compact" />
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(235,255,238,0.74)]">
                  Ambiente atual
                </p>
                <div className="mt-3 space-y-2 text-sm text-[rgba(244,255,245,0.84)]">
                  <p>{company.environment}</p>
                  <p>{company.deploymentTarget}</p>
                  <a
                    className="inline-flex items-center gap-2 font-medium text-[#79ef8d] transition hover:text-white"
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Site principal
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#e4ebe5] bg-white/95 px-6 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-medium tracking-[-0.04em] text-[#101b12]">
                {pageTitle}
              </h1>
              <span className="hidden rounded-lg border border-[#dde6de] bg-[#f7faf7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#68826c] sm:inline-flex">
                Painel interno
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[#142116] transition hover:bg-[#f1f5f1]"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[#142116] transition hover:bg-[#f1f5f1]"
              >
                <Moon className="h-5 w-5" />
              </button>
              <ProfileMenu initial={getAdminInitial(adminUser)} />
            </div>
          </header>

          <main className="min-w-0 p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
