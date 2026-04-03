import { NextResponse } from "next/server";

export function successResponse<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json({ data }, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function paginatedResponse<T>(
  data: T,
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  },
  init?: ResponseInit,
) {
  const response = NextResponse.json({ data, meta }, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
) {
  const response = NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );

  response.headers.set("Cache-Control", "no-store");
  return response;
}
