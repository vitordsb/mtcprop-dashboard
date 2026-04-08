import { notFound } from "next/navigation";

import { SaleDetailView } from "@/components/dashboard/sale-detail-view";
import { getSaleDetailOverview } from "@/lib/api";
import type { SaleDetailTab } from "@/types/sales";

export const dynamic = "force-dynamic";

const VALID_TABS = new Set<SaleDetailTab>([
  "detail",
  "buyer",
  "extras",
  "comments",
  "audit",
]);

function resolveTab(value: string | undefined): SaleDetailTab {
  if (value && VALID_TABS.has(value as SaleDetailTab)) {
    return value as SaleDetailTab;
  }

  return "detail";
}

type SaleDetailPageProps = {
  params: Promise<{
    saleId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function SaleDetailPage({
  params,
  searchParams,
}: SaleDetailPageProps) {
  const { saleId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getSaleDetailOverview(saleId);

  if (!data) {
    notFound();
  }

  return <SaleDetailView data={data} activeTab={resolveTab(resolvedSearchParams.tab)} />;
}
