import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "erp_access";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Static assets and internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes("/next.svg") ||
    pathname.includes("/vercel.svg")
  ) {
    return NextResponse.next();
  }

  // Redirect root page to dashboard (which handles auth redirect)
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    if (token) {
      // User is authenticated, don't let them visit login/register
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected pages
  if (!token) {
    // User is not authenticated, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
