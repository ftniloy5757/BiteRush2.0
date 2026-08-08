import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // If the user is not logged in and tries to access protected routes
  if (!token) {
    // Protect all authenticated routes
    if (
      url.pathname.startsWith("/profile") ||
      url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  } else {
    // User is logged in
    // Redirect authenticated users away from auth pages
    if (
      url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/verify")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based access control
    const userRole = token.role as string;

    // Protect admin routes - only allow users with admin role
    if (url.pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect rider routes
    if (url.pathname.startsWith("/rider") && userRole !== "rider") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Otherwise allow the request
  return NextResponse.next();
}

// Config for protected paths
export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/verify/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/rider/:path*",
  ],
};

