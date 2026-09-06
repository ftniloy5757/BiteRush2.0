// /app/admin/users/[userId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch data");
  }
  return res.json();
};

export default function EditUserPage() {
  const params = useParams();
  const  userId = params.userId;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data
  const {
    data: user,
    error,
    mutate,
  } = useSWR(userId === "new" ? null : `/api/admin/users/${userId}`, fetcher);

  // Setup form
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "", // Optional for updates
      role: "customer" as "customer" | "restaurant" | "rider" | "admin",
      restaurantName: "",
      restaurantAddress: "",
      vehicleType: "",
      bio: "",
      contactNumber: "",
      themePreference: "light" as const,
      status: "Online" as const,
      isEmailVerified: false,
      isPhoneVerified: false,
    },
  });

const cleanInput = (val?: string | null) => {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (
    trimmed.toUpperCase().includes("[ENCRYPTED]") ||
    trimmed.startsWith("{") ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    return "";
  }
  return trimmed;
};

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: cleanInput(user.firstName),
        lastName: cleanInput(user.lastName),
        email: cleanInput(user.email),
        password: "", // Don't populate password
        role: user.role || "customer",
        restaurantName: cleanInput(user.restaurantName),
        restaurantAddress: cleanInput(user.restaurantAddress),
        vehicleType: cleanInput(user.vehicleType),
        bio: cleanInput(user.bio),
        contactNumber: cleanInput(user.contactNumber),
        themePreference: user.themePreference || "light",
        status: user.status || "Online",
        isEmailVerified: !!user.isEmailVerified,
        isPhoneVerified: !!user.isPhoneVerified,
      });
    }
  }, [user, form]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Remove empty password if not provided
      if (!data.password) {
        delete data.password;
      }

      let response;

      if (userId === "new") {
        // Create new user
        response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        // Update existing user
        response = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save user");
      }

      toast.success(
        userId === "new"
          ? "User created successfully"
          : "User updated successfully"
      );

      if (userId === "new") {
        // Redirect to users list after creating new user
        router.push("/admin/users");
      } else {
        // Refresh data after update
        mutate();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (userId !== "new" && !user && !error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-64" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array(6)
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
            <CardTitle className="text-red-800">Error Loading User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
            <div className="mt-6 flex gap-4">
              <Button onClick={() => mutate()} variant="outline">
                Try Again
              </Button>
              <Link href="/admin/users">
                <Button variant="secondary">Back to Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
          <CardTitle>
            {userId === "new" ? "Create New User" : "Edit User"}
          </CardTitle>
          <CardDescription>
            {userId === "new"
              ? "Add a new user to the system"
              : `Editing user: ${[cleanInput(user?.firstName), cleanInput(user?.lastName)].filter(Boolean).join(" ").trim() || cleanInput(user?.email) || (typeof userId === "string" ? `#${userId.slice(-6)}` : "User")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  rules={{ required: "First name is required" }}
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  rules={{ required: "Last name is required" }}
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Number */}
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Optional contact number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                    ...(userId === "new"
                      ? { required: "Password is required" }
                      : {}),
                  }}
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          placeholder={
                            userId === "new"
                              ? ""
                              : "Leave blank to keep current password"
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {userId === "new"
                          ? "Set a secure password"
                          : "Leave blank to keep current password"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  rules={{ required: "Role is required" }}
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="rider">Rider</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Theme Preference */}
                <FormField
                  control={form.control}
                  name="themePreference"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Theme Preference</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Restaurant Specific Fields */}
                {form.watch("role") === "restaurant" && (
                  <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                    <FormField
                      control={form.control}
                      name="restaurantName"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Gourmet Burger Bistro" />
                          </FormControl>
                          <FormDescription>Commercial display name of the restaurant</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="restaurantAddress"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Restaurant Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. House 14, Road 7, Dhanmondi, Dhaka" />
                          </FormControl>
                          <FormDescription>Kitchen location for order pickup by riders</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Rider Specific Fields */}
                {form.watch("role") === "rider" && (
                  <div className="col-span-full p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40">
                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Motorcycle"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                              <SelectItem value="Bicycle">Bicycle</SelectItem>
                              <SelectItem value="Scooter">Scooter</SelectItem>
                              <SelectItem value="Electric Bike">Electric Bike</SelectItem>
                              <SelectItem value="Car">Car</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Assigned transit method for route delivery</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="User bio or description"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description about the user (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Away">Away</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Verification Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Verification */}
                <FormField
                  control={form.control}
                  name="isEmailVerified"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                      <div>
                        <FormLabel>Email Verified</FormLabel>
                        <FormDescription>
                          Toggle if user&apos;s email is verified
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Phone Verification */}
                <FormField
                  control={form.control}
                  name="isPhoneVerified"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                      <div>
                        <FormLabel>Phone Verified</FormLabel>
                        <FormDescription>
                          Toggle if user&apos;s phone is verified
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Link href="/admin/users">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save User"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
