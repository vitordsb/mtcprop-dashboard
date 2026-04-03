import { NextResponse } from "next/server";

import { dashboardService } from "@/lib/services/dashboard-service";

export async function GET() {
  const overview = await dashboardService.getOverview();
  return NextResponse.json({ data: overview.enrollments });
}
