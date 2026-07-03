import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  // If on public route and logged in → go to dashboard
  if (publicRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If on protected route and not logged in → go to login
  const isPublicRoute = publicRoutes.includes(pathname);
  const isNextInternal = pathname.startsWith("/_next");
  const isApiRoute = pathname.startsWith("/api");
  const isRoot = pathname === "/";

  if (!isPublicRoute && !isNextInternal && !isApiRoute && !isRoot && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
