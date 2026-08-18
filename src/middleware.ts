import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Protected paths that require authentication
  const isProtectedPath =
    url.pathname.startsWith("/cart") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/payment") ||
    url.pathname.startsWith("/orders") ||
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/restaurant") ||
    url.pathname.startsWith("/rider");

  // If unauthenticated and accessing a protected route -> Redirect to sign-in
  if (!token) {
    if (isProtectedPath) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", url.pathname);
      return NextResponse.redirect(signInUrl);
    }
  } else {
    const userRole = token.role as string;

    // Authenticated user accessing root homepage ("/") -> Redirect to role dashboard
    if (url.pathname === "/") {
      if (userRole === "restaurant") {
        return NextResponse.redirect(new URL("/restaurant", request.url));
      } else if (userRole === "rider") {
        return NextResponse.redirect(new URL("/rider", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Authenticated user trying to access auth pages -> Redirect to appropriate dashboard
    if (
      url.pathname.startsWith("/sign-in") ||
      url.pathname.startsWith("/sign-up") ||
      url.pathname.startsWith("/verify")
    ) {
      if (userRole === "restaurant") {
        return NextResponse.redirect(new URL("/restaurant", request.url));
      } else if (userRole === "rider") {
        return NextResponse.redirect(new URL("/rider", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based access control
    // Protect restaurant routes - only allow restaurant role
    if (url.pathname.startsWith("/restaurant") && userRole !== "restaurant") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect rider routes - only allow rider role
    if (url.pathname.startsWith("/rider") && userRole !== "rider") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Config for protected paths
export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/verify/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/payment/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/restaurant/:path*",
    "/rider/:path*",
  ],
};
