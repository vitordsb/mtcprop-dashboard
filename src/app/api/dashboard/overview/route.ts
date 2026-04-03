import { NextResponse } from "next/server";

import { dashboardService } from "@/lib/services/dashboard-service";

export async function GET() {
  const data = await dashboardService.getOverview();
  return NextResponse.json({ data });
}
