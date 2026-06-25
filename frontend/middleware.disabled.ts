import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/zone") ||
    pathname === "/";

  // ✅ allow login page ALWAYS
  if (isLoginPage) {
    return NextResponse.next();
  }

  // ❌ no token → only block protected pages
  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}