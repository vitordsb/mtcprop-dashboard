import { DashboardOverviewView } from "@/components/dashboard/dashboard-overview";
import { getDashboardOverview } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const data = await getDashboardOverview();

  return <DashboardOverviewView data={data} />;
}
