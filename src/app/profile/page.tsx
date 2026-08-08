"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Utensils, MapPin, Phone, Mail, Calendar, Edit } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  bio: string;
  profilePicture: string | null;
  themePreference: "light" | "dark";
  status: "Online" | "Away" | "Busy";
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch profile");
        }
        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-orange-600 text-lg font-medium">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4 text-xl">
            You must be logged in to view this page
          </div>
          <Link
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-3 rounded-md font-medium hover:from-orange-600 hover:to-amber-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-2 rounded-md font-medium hover:from-orange-600 hover:to-amber-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-t-2xl p-6 text-white flex items-center justify-between">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold">BiteRush Profile</h1>
          </div>
          <Link
            href="/profile/edit"
            className="flex items-center bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-md">
                {user?.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile Picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-600">
                    <span className="text-3xl font-bold">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                {user?.firstName} {user?.lastName}
              </h2>

              <div className="text-gray-600 mt-1 mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.status === "Online"
                      ? "bg-green-100 text-green-800"
                      : user?.status === "Busy"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user?.status}
                </span>

                <span className="mx-2 text-gray-300">|</span>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.themePreference === "dark"
                      ? "bg-gray-800 text-gray-100"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user?.themePreference} Mode
                </span>
              </div>

              {user?.bio && (
                <p className="text-gray-600 mb-4 border-l-4 border-orange-200 pl-3 italic">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </h3>

            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="text-gray-800">{user?.email}</p>
                  <span
                    className={`text-xs ${
                      user?.isEmailVerified ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {user?.isEmailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="text-gray-800">
                    {user?.contactNumber || "No phone number added"}
                  </p>
                  {user?.contactNumber && (
                    <span
                      className={`text-xs ${
                        user?.isPhoneVerified
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {user?.isPhoneVerified ? "Verified" : "Not Verified"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-orange-500 mr-2" />
              <p className="text-sm text-gray-600">
                Account created:{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Orders
              </h3>
              <Link
                href="/orders"
                className="text-orange-600 text-sm hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                Start placing orders to see your order history!
              </p>
              <Link
                href="/menu"
                className="inline-block mt-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-orange-600 hover:to-amber-700 transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
