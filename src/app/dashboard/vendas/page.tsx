import { DashboardShell } from "@/components/dashboard/app-shell";
import { SalesOverviewClient } from "@/components/dashboard/sales-overview-client";
import { getSalesOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type VendasPageProps = {
  searchParams?: Promise<{
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function VendasPage({ searchParams }: VendasPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getSalesOverview({
    period: resolvedSearchParams.period ?? null,
    dateFrom: resolvedSearchParams.dateFrom ?? null,
    dateTo: resolvedSearchParams.dateTo ?? null,
  });

  return (
    <DashboardShell company={data.company} pageTitle="Vendas">
      <SalesOverviewClient
        key={`${data.period}:${data.dateFrom}:${data.dateTo}`}
        data={data}
      />
    </DashboardShell>
  );
}
