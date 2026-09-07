"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ChefHat,
  Bike,
  UtensilsCrossed,
  ClipboardList,
  Headphones,
  ShoppingBag,
  ShoppingBag as CartIcon,
  MessageSquare,
} from "lucide-react";
import { ModeToggle } from "./theme-toggle";

export default function Navbar() {
  const { data: session } = useSession();

  const cleanField = (s?: string | null) => {
    if (!s || typeof s !== "string") return "";
    const trimmed = s.trim();
    if (
      trimmed.startsWith("{") ||
      trimmed.includes("RSA-1024") ||
      trimmed.toUpperCase().includes("[ENCRYPTED]") ||
      trimmed === "undefined" ||
      trimmed === "null"
    ) {
      return "";
    }
    return trimmed;
  };

  const safeFirstName =
    cleanField(session?.user?.firstName) ||
    cleanField(session?.user?.restaurantName) ||
    (session?.user?.email && session.user.email.includes("@")
      ? session.user.email.split("@")[0].charAt(0).toUpperCase() + session.user.email.split("@")[0].slice(1)
      : "") ||
    (session?.user?.role ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1) : "User");

  const safeLastName = cleanField(session?.user?.lastName);
  const safeEmail = cleanField(session?.user?.email);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!safeFirstName) return "U";
    return `${safeFirstName[0]}${safeLastName ? safeLastName[0] : ""}`.toUpperCase();
  };

  const fullName = session?.user
    ? `${safeFirstName} ${safeLastName}`.trim()
    : "User";

  const userRole = session?.user?.role || "customer";

  const getRoleBadge = () => {
    switch (userRole) {
      case "admin":
        return <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Admin</span>;
      case "restaurant":
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Restaurant</span>;
      case "rider":
        return <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Rider</span>;
      default:
        return <span className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Customer</span>;
    }
  };

  return (
    <nav className="p-3.5 md:p-4 shadow-sm fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 transition-colors">
      <div className="container mx-auto flex flex-row justify-between items-center max-w-7xl px-2 sm:px-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <Link
            href={
              userRole === "admin"
                ? "/admin"
                : userRole === "restaurant"
                ? "/restaurant"
                : userRole === "rider"
                ? "/rider"
                : session
                ? "/dashboard"
                : "/"
            }
            className="flex items-center gap-2.5 group"
          >
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0 border border-orange-200 dark:border-orange-900/50 bg-white dark:bg-gray-900 flex items-center justify-center p-1">
              <Image
                src="/BiteRush2_Logo.png"
                alt="BiteRush 2.0"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-gray-100 text-lg font-black tracking-tight leading-none">
                BiteRush <span className="text-orange-500 text-xs font-bold">2.0</span>
              </h2>
            </div>
          </Link>
        </div>

        {/* Role-Specific Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
          {/* Public links (Non-logged in) */}
          {!session && (
            <Link
              href="/menu"
              className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors"
            >
              Menu
            </Link>
          )}

          {/* Customer links (Logged in) */}
          {session && userRole === "customer" && (
            <>
              <Link
                href="/menu"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors"
              >
                Menu
              </Link>
              <Link
                href="/cart"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <CartIcon className="h-4 w-4" />
                Cart
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors"
              >
                Feed
              </Link>
              <Link
                href="/community"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Community
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 transition-colors"
              >
                My Orders
              </Link>
            </>
          )}

          {/* Restaurant links */}
          {userRole === "restaurant" && (
            <>
              <Link
                href="/restaurant"
                className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/restaurant/menu"
                className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Menu
              </Link>
              <Link
                href="/restaurant/orders"
                className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <ClipboardList className="h-4 w-4" />
                Orders
              </Link>
              <Link
                href="/restaurant/support"
                className="text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <Headphones className="h-4 w-4" />
                Support
              </Link>
            </>
          )}

          {/* Rider links */}
          {userRole === "rider" && (
            <>
              <Link
                href="/rider"
                className="text-gray-600 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/rider/deliveries"
                className="text-gray-600 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5"
              >
                <Bike className="h-4 w-4" />
                Deliveries
              </Link>
            </>
          )}

          {/* Admin links */}
          {userRole === "admin" && (
            <>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <ClipboardList className="h-4 w-4" />
                Orders
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <User className="h-4 w-4" />
                Users
              </Link>
              <Link
                href="/community"
                className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                Community
              </Link>
            </>
          )}
        </div>

        {/* Right-side Profile / Auth */}
        <div className="flex items-center gap-3">
          <ModeToggle />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.profilePicture || ""} alt={fullName} />
                    <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left pr-2">
                    <span className="text-xs font-bold block leading-tight truncate max-w-[100px]">
                      {safeFirstName}
                    </span>
                    {getRoleBadge()}
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60 bg-white dark:bg-gray-950 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800"
              >
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {fullName}
                    </span>
                    {getRoleBadge()}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{safeEmail}</p>
                </div>

                <DropdownMenuSeparator />

                {/* Role Portals */}
                {userRole === "customer" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center text-xs py-2">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-orange-500" />
                        <span>Customer Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/community" className="flex items-center text-xs py-2">
                        <MessageSquare className="mr-2 h-4 w-4 text-orange-500" />
                        <span>Community</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center text-xs py-2">
                        <ClipboardList className="mr-2 h-4 w-4 text-orange-500" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {userRole === "restaurant" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/restaurant" className="flex items-center text-xs py-2">
                        <ChefHat className="mr-2 h-4 w-4 text-emerald-500" />
                        <span>Restaurant Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/restaurant/menu" className="flex items-center text-xs py-2">
                        <UtensilsCrossed className="mr-2 h-4 w-4 text-emerald-500" />
                        <span>Manage Menu</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/restaurant/orders" className="flex items-center text-xs py-2">
                        <ClipboardList className="mr-2 h-4 w-4 text-emerald-500" />
                        <span>Incoming Orders</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {userRole === "rider" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/rider" className="flex items-center text-xs py-2">
                        <Bike className="mr-2 h-4 w-4 text-violet-500" />
                        <span>Rider Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/rider/deliveries" className="flex items-center text-xs py-2">
                        <ClipboardList className="mr-2 h-4 w-4 text-violet-500" />
                        <span>Active Deliveries</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {userRole === "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center text-xs py-2">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-red-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/orders" className="flex items-center text-xs py-2">
                        <ClipboardList className="mr-2 h-4 w-4 text-red-500" />
                        <span>Manage Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="flex items-center text-xs py-2">
                        <User className="mr-2 h-4 w-4 text-red-500" />
                        <span>Manage Users</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/community" className="flex items-center text-xs py-2">
                        <MessageSquare className="mr-2 h-4 w-4 text-red-500" />
                        <span>Community Feed</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center text-xs py-2">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="flex items-center text-xs py-2">
                    <Settings className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center text-xs text-red-500 focus:text-red-500 py-2 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-xs font-bold rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
