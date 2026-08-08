"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, LogOut, Settings, LayoutDashboard, Shield } from "lucide-react";
import { ModeToggle } from "./theme-toggle";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

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

  return (
    <nav className="p-4 md:p-6 shadow-md fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="container mx-auto flex flex-row justify-between items-center">
        {/* Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href={session ? "/dashboard" : "/"}>
            <h2 className="text-foreground text-lg font-bold leading-tight tracking-[-0.015em]">
              BiteRush
            </h2>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/menu"
            className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
          >
            Menu
          </Link>
          <Link
            href="/cart"
            className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
          >
            Cart
          </Link>
          {session && (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
              >
                My Orders
              </Link>
              {session.user.role === "rider" && (
                <Link
                  href="/rider/deliveries"
                  className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
                >
                  Deliveries
                </Link>
              )}
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400 font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right-side Buttons */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* Auth Buttons */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative rounded-full h-8 w-8 p-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.profilePicture || ""}
                      alt={fullName}
                    />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-gray-950"
                sideOffset={5}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.profilePicture || ""}
                      alt={fullName}
                    />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email || ""}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex w-full items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile/edit"
                    className="flex w-full items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Orders</span>
                  </Link>
                </DropdownMenuItem>

                {/* Admin access */}
                {session.user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/create-admin"
                        className="flex w-full items-center"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Create Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="flex items-center text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" className="w-auto">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="w-auto rounded-lg">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
