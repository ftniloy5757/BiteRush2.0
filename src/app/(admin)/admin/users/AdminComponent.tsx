// /app/admin/users/AdminComponent.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import React from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  Utensils,
  Bike,
  User as UserIcon,
} from "lucide-react";

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch data");
  }
  return res.json();
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get query params
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const searchQuery = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "";
  const [role, setRole] = useState(roleFilter || "all");

  // Local state
  const [search, setSearch] = useState(searchQuery);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch users data
  const { data, error, mutate } = useSWR(
    `/api/admin/users?page=${page}&limit=${limit}&search=${searchQuery}&role=${roleFilter}`,
    fetcher
  );

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search, page: 1 });
  };

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setRole(value);
    updateQueryParams({ role: value === "all" ? "" : value, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateQueryParams({ page: newPage });
  };

  // Update query params
  const updateQueryParams = (params: Record<string, any>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === null) {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";
    router.push(`/admin/users${query}`);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(userId);
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete user");
        }

        toast.success("User deleted successfully");
        mutate();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Helper: Sanitize and compute clean display name
  const getUserDisplayName = (user: any) => {
    const sanitize = (s: any) => {
      if (!s || typeof s !== "string") return "";
      const trimmed = s.trim();
      if (
        trimmed.startsWith("{") ||
        trimmed.includes("RSA-1024") ||
        trimmed.includes("alg") ||
        trimmed === "[ENCRYPTED]"
      ) {
        return "";
      }
      return trimmed;
    };

    const fn = sanitize(user.firstName);
    const ln = sanitize(user.lastName);
    if (fn || ln) {
      return `${fn} ${ln}`.trim();
    }

    if (user.email && typeof user.email === "string" && !user.email.startsWith("{")) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return `${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"} #${String(
      user._id || ""
    ).slice(-4)}`;
  };

  // Helper: Initials
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: Role Icon
  const getRoleIcon = (userRole: string) => {
    switch (userRole?.toLowerCase()) {
      case "admin":
        return <Shield className="h-3 w-3 mr-1" />;
      case "restaurant":
        return <Utensils className="h-3 w-3 mr-1" />;
      case "rider":
        return <Bike className="h-3 w-3 mr-1" />;
      default:
        return <UserIcon className="h-3 w-3 mr-1" />;
    }
  };

  // Loading state
  if (!data && !error) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Card className="border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600 dark:text-red-300 text-sm">{error.message}</p>
            <Button onClick={() => mutate()} variant="outline" className="rounded-xl">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-xl text-white">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Users className="h-4 w-4" /> User Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            User Accounts & Permissions
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Inspect, manage, filter roles, and update account permissions across BiteRush 2.0.
          </p>
        </div>

        <Link href="/admin/users/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl px-5 py-2.5 shadow-lg shadow-orange-500/20 transition-transform active:scale-95 flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Add New User
          </Button>
        </Link>
      </div>

      {/* Main Table Card */}
      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl text-sm"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl font-bold text-xs"
              >
                Search
              </Button>
            </form>

            {/* Role Filter */}
            <div className="w-full sm:w-52">
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-semibold">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-gray-900 border-gray-800">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[800px] w-full text-left">
              <TableHeader className="bg-gray-50/75 dark:bg-gray-800/50">
                <TableRow className="border-b border-gray-100 dark:border-gray-800">
                  <TableHead className="py-4 pl-6 font-bold text-xs uppercase tracking-wider text-gray-500">
                    User Profile
                  </TableHead>
                  <TableHead className="py-4 font-bold text-xs uppercase tracking-wider text-gray-500">
                    Email Address
                  </TableHead>
                  <TableHead className="py-4 font-bold text-xs uppercase tracking-wider text-gray-500">
                    Role
                  </TableHead>
                  <TableHead className="py-4 font-bold text-xs uppercase tracking-wider text-gray-500">
                    Status
                  </TableHead>
                  <TableHead className="py-4 font-bold text-xs uppercase tracking-wider text-gray-500">
                    Verification
                  </TableHead>
                  <TableHead className="py-4 pr-6 text-right font-bold text-xs uppercase tracking-wider text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-16 text-gray-500 dark:text-gray-400 text-sm"
                    >
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400 opacity-50" />
                      No registered users match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user: any) => {
                    const displayName = getUserDisplayName(user);
                    const initials = getUserInitials(displayName);
                    const userRole = (user.role || "customer").toLowerCase();

                    return (
                      <TableRow
                        key={user._id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        {/* Profile with Avatar */}
                        <TableCell className="py-4 pl-6 max-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs shrink-0 border border-orange-200 dark:border-orange-800/50">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                {displayName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                ID: #{String(user._id || "").slice(-6)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-4 max-w-[240px]">
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-mono truncate block">
                            {user.email && !user.email.startsWith("{") ? user.email : "—"}
                          </span>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={
                              userRole === "admin"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800 uppercase text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                                : userRole === "restaurant"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 uppercase text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                                : userRole === "rider"
                                ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800 uppercase text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                                : "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800 uppercase text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                            }
                          >
                            {getRoleIcon(userRole)}
                            {userRole}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                user.status === "active" || !user.status
                                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                                  : user.status === "suspended"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <span className="capitalize text-gray-700 dark:text-gray-300 text-xs">
                              {user.status || "active"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Verified */}
                        <TableCell className="py-4">
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
                              <XCircle className="h-3.5 w-3.5" /> Unverified
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 pr-6 text-right space-x-2">
                          <Link href={`/admin/users/${user._id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs h-8 px-3"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={isDeleting === user._id}
                            className="rounded-xl font-bold text-xs h-8 px-3"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {isDeleting === user._id ? "..." : "Delete"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-800">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-40 rounded-xl"
                          : "cursor-pointer rounded-xl"
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: data.pagination.pages },
                    (_, i) => i + 1
                  )
                    .filter((p) => {
                      const isFirst = p === 1;
                      const isLast = p === data.pagination.pages;
                      const isCurrentPage = p === page;
                      const isNearCurrent = Math.abs(p - page) <= 1;
                      return isFirst || isLast || isCurrentPage || isNearCurrent;
                    })
                    .map((p, i, filtered) => {
                      const prevPage = filtered[i - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-3 text-gray-400">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => handlePageChange(p)}
                              className="rounded-xl cursor-pointer font-bold"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(
                          Math.min(data.pagination.pages, page + 1)
                        )
                      }
                      className={
                        page >= data.pagination.pages
                          ? "pointer-events-none opacity-40 rounded-xl"
                          : "cursor-pointer rounded-xl"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
