"use client";

import React from "react";
import Link from "next/link";
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
} from "lucide-react";
import { ModeToggle } from "./theme-toggle";

export default function Navbar() {
  const { data: session } = useSession();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.firstName) return "U";
    return `${session.user.firstName[0]}${
      session.user.lastName ? session.user.lastName[0] : ""
    }`.toUpperCase();
  };

  const fullName = session?.user
    ? `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim()
    : "User";

  const userRole = session?.user?.role || "customer";

  const getRoleBadge = () => {
    switch (userRole) {
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
              userRole === "restaurant"
                ? "/restaurant"
                : userRole === "rider"
                ? "/rider"
                : session
                ? "/dashboard"
                : "/"
            }
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5 w-5" />
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
                      {session.user.firstName || "User"}
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
                  <p className="text-[11px] text-gray-400 truncate">{session.user.email}</p>
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
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
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
