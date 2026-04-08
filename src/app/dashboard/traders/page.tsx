import { TradersOverviewView } from "@/components/dashboard/traders-overview";
import { getTradersOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function TradersPage() {
  const data = await getTradersOverview();

  return <TradersOverviewView data={data} />;
}
