import { Banknote } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getDashboardOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MensalidadesPage() {
  const { company } = await getDashboardOverview();

  return (
    <DashboardShell company={company} pageTitle="Mensalidades">
      <div className="theme-card flex flex-col items-center justify-center rounded-[22px] border-dashed py-24 text-center">
        <div className="theme-accent-icon mb-5 flex h-14 w-14 items-center justify-center rounded-[18px]">
          <Banknote className="h-6 w-6" />
        </div>
        <h2 className="theme-title text-xl font-semibold tracking-[-0.04em]">
          Mensalidades
        </h2>
        <p className="theme-text-muted mt-2 max-w-sm text-sm leading-6">
          Controle de recorrências, cobranças mensais e status de pagamento dos
          traders ativos. Em desenvolvimento.
        </p>
      </div>
    </DashboardShell>
  );
}
