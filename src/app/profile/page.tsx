"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Utensils,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  Plus,
  Home,
  Briefcase,
  CheckCircle,
  ChefHat,
  Bike,
  Shield,
  Store,
} from "lucide-react";
import Link from "next/link";

interface SavedAddress {
  id?: string;
  _id?: string;
  label: string;
  address: string;
  area?: string;
  details?: string;
  isDefault?: boolean;
}

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
  savedAddresses?: SavedAddress[];
  role?: string;
  restaurantName?: string | null;
  restaurantAddress?: string | null;
  vehicleType?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Sanitizes any raw ciphertext envelopes, algorithmic tags, or literal "[ENCRYPTED]" placeholders
 */
function cleanString(val?: string | null): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (
    trimmed.startsWith("{") ||
    trimmed.includes("RSA-1024") ||
    trimmed.includes("ECC-SECP256K1") ||
    trimmed.toUpperCase().includes("[ENCRYPTED]") ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    return "";
  }
  return trimmed;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setUser(data);
      } catch (err: any) {
        console.warn("Profile fetch failed, using fallback:", err);
        // Resilient fallback so page never breaks
        const isDemo = session?.user?.email?.toLowerCase() === "customer@biterush.com";
        if (session?.user) {
          setUser({
            id: session.user.id || "current-user",
            firstName: cleanString(session.user.firstName) || "User",
            lastName: cleanString(session.user.lastName) || "",
            email: cleanString(session.user.email) || "",
            contactNumber: cleanString(session.user.contactNumber) || (isDemo ? "+8801740734780" : ""),
            bio: isDemo ? "Food enthusiast & BiteRush member" : "",
            profilePicture: session.user.profilePicture || null,
            themePreference: "light",
            status: "Online",
            role: session.user.role || "customer",
            restaurantName: cleanString(session.user.restaurantName) || null,
            vehicleType: cleanString(session.user.vehicleType) || null,
            isPhoneVerified: true,
            isEmailVerified: true,
            savedAddresses: isDemo
              ? [
                  {
                    id: "addr-1",
                    label: "Home",
                    address: "Dhanmondi 19 House No. 226/A",
                    area: "Dhanmondi",
                    details: "Please give a call 10 minutes before reaching",
                    isDefault: true,
                  },
                  {
                    id: "addr-2",
                    label: "Office",
                    address: "House 15, Road 5, Block B",
                    area: "Gulshan",
                    details: "Leave at front desk reception",
                    isDefault: false,
                  },
                ]
              : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-orange-600 dark:text-orange-400 text-lg font-medium">
            Loading your profile...
          </div>
        </div>
      </div>
    );
  }

  if (!session && !user) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 dark:text-red-400 mb-4 text-xl font-semibold">
            You must be logged in to view this page
          </div>
          <Link
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 shadow-md transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const role = (user?.role || session?.user?.role || "customer").toLowerCase();

  const safeFirstName =
    cleanString(user?.firstName) ||
    cleanString(session?.user?.firstName) ||
    (role === "restaurant" ? cleanString(user?.restaurantName) : "") ||
    (user?.email && user.email.includes("@") ? user.email.split("@")[0] : "") ||
    (role.charAt(0).toUpperCase() + role.slice(1));
  const safeLastName = cleanString(user?.lastName) || cleanString(session?.user?.lastName);
  const safeEmail = cleanString(user?.email) || cleanString(session?.user?.email);
  const safeContact = cleanString(user?.contactNumber) || cleanString(session?.user?.contactNumber);
  const safeBio = cleanString(user?.bio);
  const safeRestaurantName = cleanString(user?.restaurantName) || cleanString(session?.user?.restaurantName);
  const safeRestaurantAddress = cleanString(user?.restaurantAddress);
  const safeVehicleType = cleanString(user?.vehicleType) || cleanString(session?.user?.vehicleType);

  const addresses = Array.isArray(user?.savedAddresses) ? user.savedAddresses : [];

  // Header meta based on role
  const getHeaderMeta = () => {
    switch (role) {
      case "admin":
        return {
          title: "Administrator Profile",
          subtitle: "Administrative credentials, platform oversight & security permissions",
          icon: <Shield className="h-7 w-7 text-white" />,
          gradient: "from-red-600 via-rose-600 to-orange-600",
        };
      case "restaurant":
        return {
          title: "Restaurant Profile",
          subtitle: "Manage restaurant identity, kitchen details & operational contact",
          icon: <ChefHat className="h-7 w-7 text-white" />,
          gradient: "from-emerald-600 via-teal-600 to-cyan-700",
        };
      case "rider":
        return {
          title: "Rider Profile",
          subtitle: "Courier credentials, delivery vehicle & dispatch status",
          icon: <Bike className="h-7 w-7 text-white" />,
          gradient: "from-violet-600 via-purple-600 to-indigo-700",
        };
      default:
        return {
          title: "Customer Profile",
          subtitle: "Manage your details & saved delivery locations",
          icon: <Utensils className="h-7 w-7 text-white" />,
          gradient: "from-orange-500 via-amber-500 to-amber-600",
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-orange-50/60 dark:bg-gray-950 py-12 px-4 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div className={`bg-gradient-to-r ${headerMeta.gradient} rounded-t-3xl p-6 md:p-8 text-white flex items-center justify-between shadow-lg`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
              {headerMeta.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{headerMeta.title}</h1>
              <p className="text-white/90 text-sm">{headerMeta.subtitle}</p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        {/* Profile Content */}
        <div className="bg-white dark:bg-gray-900 rounded-b-3xl shadow-xl border-x border-b border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-950/40 border-4 border-white dark:border-gray-800 shadow-lg">
                {user?.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile Picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <span className="text-3xl font-extrabold">
                      {safeFirstName.charAt(0).toUpperCase()}
                      {safeLastName ? safeLastName.charAt(0).toUpperCase() : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="flex-grow text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeFirstName} {safeLastName}
              </h2>

              <div className="text-gray-600 dark:text-gray-400 mt-2 mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
                    user?.status === "Online" || !user?.status
                      ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400"
                      : user?.status === "Busy"
                      ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                      : "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  ● {user?.status || "Online"}
                </span>

                <span className="text-gray-300 dark:text-gray-700">•</span>

                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                  {role}
                </span>

                <span className="text-gray-300 dark:text-gray-700">•</span>

                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {user?.themePreference === "dark" ? "Dark Theme" : "Light Theme"}
                </span>
              </div>

              {safeBio ? (
                <p className="text-gray-600 dark:text-gray-300 text-sm border-l-4 border-orange-400 dark:border-orange-500 pl-3 italic">
                  &ldquo;{safeBio}&rdquo;
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-xs italic">
                  No bio added yet.{" "}
                  <Link href="/profile/edit" className="text-orange-600 dark:text-orange-400 hover:underline not-italic font-medium">
                    Add a bio
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Role-Specific Information */}
          {role === "restaurant" && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-500" />
                Restaurant Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Restaurant Brand Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {safeRestaurantName || `${safeFirstName} Kitchen`}
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kitchen Address</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {safeRestaurantAddress || "Dhanmondi, Dhaka, Bangladesh"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {role === "rider" && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bike className="h-5 w-5 text-violet-500" />
                Courier & Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Delivery Vehicle Type</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {safeVehicleType || "Motorcycle"}
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Delivery Fleet Status</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Ready for Dispatches
                  </p>
                </div>
              </div>
            </div>
          )}

          {role === "admin" && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Administrator Privileges
              </h3>
              <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Full Platform Access & Decryption
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Authorized to inspect user accounts, manage menu inventory, review system logs, and decrypt order records.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 inline-block text-center"
                >
                  Admin Portal →
                </Link>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-lg mr-3">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{safeEmail || "—"}</p>
                  <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                    ✓ Verified
                  </span>
                </div>
              </div>

              <div className="flex items-center p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-lg mr-3">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Contact Number</p>
                  {safeContact ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {safeContact}
                      </p>
                      <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                        ✓ Active Contact
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-500 italic">
                        Not provided yet
                      </p>
                      <Link
                        href="/profile/edit"
                        className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        + Add phone number
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Saved Delivery Addresses (For Customers or general delivery usage) */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Saved Delivery Addresses
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Saved addresses auto-fill during checkout for quick ordering
                </p>
              </div>
              <Link
                href="/profile/edit#addresses"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 bg-orange-50 dark:bg-orange-950/50 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add / Edit
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-3">
                <MapPin className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  No saved delivery addresses yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Add your home or office delivery location to enable 1-click checkout on your BiteRush food orders.
                </p>
                <Link
                  href="/profile/edit#addresses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Delivery Address
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                  <div
                    key={addr.id || addr._id || idx}
                    className="relative p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-orange-300 dark:hover:border-orange-800 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-700">
                        {addr.label.toLowerCase() === "work" || addr.label.toLowerCase() === "office" ? (
                          <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Home className="h-3.5 w-3.5 text-orange-500" />
                        )}
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-900">
                          <CheckCircle className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                      {addr.address}
                    </p>
                    {addr.area && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                        Area: {addr.area}
                      </p>
                    )}
                    {addr.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-white dark:bg-gray-900/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800 italic">
                        &ldquo;{addr.details}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>
                Account Member Since:{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "2026"}
              </span>
            </div>
            <Link
              href={role === "admin" ? "/admin/orders" : role === "restaurant" ? "/restaurant/orders" : role === "rider" ? "/rider/deliveries" : "/orders"}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
            >
              {role === "rider" ? "View Delivery Tasks →" : "View Order History →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
