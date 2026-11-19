import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getBaseCookieOptions,
  getCsrfCookieOptions,
} from "./cookies";

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...getBaseCookieOptions(),
    maxAge: 60 * 15,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...getBaseCookieOptions(),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function setCsrfCookie(response: NextResponse, signedToken: string) {
  response.cookies.set(CSRF_COOKIE, signedToken, {
    ...getCsrfCookieOptions(),
    maxAge: 60 * 60 * 4,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...getBaseCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...getBaseCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(CSRF_COOKIE, "", {
    ...getCsrfCookieOptions(),
    maxAge: 0,
  });
}
