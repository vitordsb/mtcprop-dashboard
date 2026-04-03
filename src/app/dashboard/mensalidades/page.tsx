import { Banknote } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getDashboardOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MensalidadesPage() {
  const { company } = await getDashboardOverview();

  return (
    <DashboardShell company={company} pageTitle="Mensalidades">
      <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[#dfe8e0] bg-white py-24 text-center shadow-[0_18px_40px_rgba(12,25,13,0.04)]">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[rgba(69,225,95,0.1)] text-[#176124]">
          <Banknote className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#0c160d]">
          Mensalidades
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#627364]">
          Controle de recorrências, cobranças mensais e status de pagamento dos
          traders ativos. Em desenvolvimento.
        </p>
      </div>
    </DashboardShell>
  );
}
