import { DashboardShell } from "@/components/dashboard/app-shell";
import { TradersTableClient } from "@/components/dashboard/traders-table-client";
import type { TradersOverview } from "@/types/traders";

type TradersOverviewProps = {
  data: TradersOverview;
};

export function TradersOverviewView({ data }: TradersOverviewProps) {
  return (
    <DashboardShell company={data.company} pageTitle="Traders">
      <TradersTableClient data={data} />
    </DashboardShell>
  );
}
