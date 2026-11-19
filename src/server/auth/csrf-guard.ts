import { NextRequest } from "next/server";
import { CSRF_COOKIE } from "./cookies";
import { validateCsrfToken } from "./csrf";

export function enforceCsrf(request: NextRequest): boolean {
  const headerToken = request.headers.get("x-csrf-token");
  const signed = request.cookies.get(CSRF_COOKIE)?.value ?? null;
  return validateCsrfToken(headerToken, signed);
}
