import { dashboardOverviewMock } from "@/lib/mock-data";
import type { DashboardOverview } from "@/types/dashboard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1";

async function request<T>(path: string, fallbackData: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallbackData;
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return request("/dashboard/overview", dashboardOverviewMock);
}

