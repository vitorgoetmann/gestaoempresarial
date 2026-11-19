import { getEnv } from "../env";

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  domain?: string;
};

export const ACCESS_TOKEN_COOKIE = "erp_access";
export const REFRESH_TOKEN_COOKIE = "erp_refresh";
export const CSRF_COOKIE = "erp_csrf";

export function getBaseCookieOptions(): CookieOptions {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
  };
}

export function getCsrfCookieOptions(): CookieOptions {
  const env = getEnv();
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
  };
}
