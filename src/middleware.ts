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
      url.pathname.startsWith("/restaurant") ||
      url.pathname.startsWith("/rider")
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
      const userRole = token.role as string;
      if (userRole === "restaurant") {
        return NextResponse.redirect(new URL("/restaurant", request.url));
      } else if (userRole === "rider") {
        return NextResponse.redirect(new URL("/rider", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based access control
    const userRole = token.role as string;

    // Protect restaurant routes - only allow restaurant role
    if (url.pathname.startsWith("/restaurant") && userRole !== "restaurant") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect rider routes - only allow rider role
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
    "/restaurant/:path*",
    "/rider/:path*",
  ],
};
