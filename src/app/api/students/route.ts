import { NextResponse } from "next/server";

import { tradersService } from "@/lib/services/traders-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  const result = await tradersService.getOverview({ page, limit });

  return NextResponse.json({
    data: result.traders,
    meta: result.pagination,
  });
}
