import { NextRequest } from "next/server";

export function getClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  return { ipAddress, userAgent };
}
