import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/_lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/set-password");

  const sessionToken = request.cookies.get("session")?.value;
  const session = await decrypt(sessionToken);

  if (isDashboardRoute) {
    if (!session) {
      const redirectUrl = new URL("/login", request.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAuthRoute) {
    if (session && path === "/login") {
      const redirectUrl = new URL("/dashboard", request.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (path === "/") {
    const target = session ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

