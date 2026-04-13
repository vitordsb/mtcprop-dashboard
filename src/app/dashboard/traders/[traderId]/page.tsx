import { notFound } from "next/navigation";

import { TraderProfileView } from "@/components/dashboard/trader-profile-view";
import { getTraderProfileOverview } from "@/lib/api";
import type { TraderProfileTab } from "@/types/traders";

export const dynamic = "force-dynamic";

const VALID_TABS = new Set<TraderProfileTab>([
  "detail",
  "sales",
  "etickets",
]);

function resolveTab(value: string | undefined): TraderProfileTab {
  if (value && VALID_TABS.has(value as TraderProfileTab)) {
    return value as TraderProfileTab;
  }

  return "detail";
}

type TraderProfilePageProps = {
  params: Promise<{
    traderId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function TraderProfilePage({
  params,
  searchParams,
}: TraderProfilePageProps) {
  const { traderId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getTraderProfileOverview(traderId);

  if (!data) {
    notFound();
  }

  return (
    <TraderProfileView
      data={data}
      activeTab={resolveTab(resolvedSearchParams.tab)}
    />
  );
}
