// components/admin/CreateAdminForm.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, UserPlus, CheckCircle2, Lock, Mail, User, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CreateAdminForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    bio: "",
  });

  if (status === "loading") {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Check if current user is admin
  if (session?.user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-center space-y-3">
        <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-800 dark:text-red-300">Access Denied</h3>
        <p className="text-xs text-red-600 dark:text-red-400">
          Only authorized administrators can provision new admin accounts.
        </p>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          contactNumber: formData.contactNumber || undefined,
          bio: formData.bio || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin user");
      }

      setSuccess("Admin user created successfully!");
      toast.success("New Admin provisioned with RSA encryption!");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        contactNumber: "",
        bio: "",
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to create admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 mx-auto">
          <UserPlus className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Provision New Admin</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Create an administrative account with encrypted PII and system privileges.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              First Name *
            </label>
            <div className="relative">
              <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Last Name *
            </label>
            <div className="relative">
              <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Admin Email Address *
          </label>
          <div className="relative">
            <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin.ops@biterush.com"
              className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contactNumber"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Contact Number (Optional)
          </label>
          <div className="relative">
            <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+8801700000000"
              className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Password *
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Role Bio / Department Notes
          </label>
          <div className="relative">
            <FileText className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={2}
              placeholder="Lead System Operator, Operations"
              className="pl-9 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Provisioning Admin...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create Admin Account
            </>
          )}
        </button>
      </form>
    </div>
  );
}
