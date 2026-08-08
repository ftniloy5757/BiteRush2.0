// /app/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
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

    // Update with new params
    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === null) {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    // Create new URL with updated params
    const search = current.toString();
    const query = search ? `?${search}` : "";
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
          const error = await response.json();
          throw new Error(error.error || "Failed to delete user");
        }

        toast.success("User deleted successfully");
        mutate(); // Refresh the data
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Loading state
  if (!data && !error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              Manage all users from this dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
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
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
            <Button onClick={() => mutate()} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              Manage all users from this dashboard
            </CardDescription>
          </div>
          <Link href="/admin/users/new">
            <Button>Add New User</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
            <div className="w-full sm:w-48">
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user: any) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "destructive"
                              : user.role === "rider"
                              ? "default"
                              : "outline"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>
                        {user.isEmailVerified ? (
                          <Badge variant="default" className="bg-green-500">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/admin/users/${user._id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={isDeleting === user._id}
                        >
                          {isDeleting === user._id ? "Deleting..." : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: data.pagination.pages },
                    (_, i) => i + 1
                  )
                    .filter((p) => {
                      // Show first, last, current, and pages around current
                      const isFirst = p === 1;
                      const isLast = p === data.pagination.pages;
                      const isCurrentPage = p === page;
                      const isNearCurrent = Math.abs(p - page) <= 1;

                      return (
                        isFirst || isLast || isCurrentPage || isNearCurrent
                      );
                    })
                    .map((p, i, filtered) => {
                      // Add ellipsis
                      const prevPage = filtered[i - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-4">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => handlePageChange(p)}
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
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
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
