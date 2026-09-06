// app/profile/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { MapPin, Plus, Trash2, Home, Briefcase, CheckCircle, ArrowLeft } from "lucide-react";
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
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  contactNumber?: string;
  themePreference: "light" | "dark";
  status: "Online" | "Away" | "Busy";
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  savedAddresses?: SavedAddress[];
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    contactNumber: "",
    themePreference: "light",
    status: "Online",
  });

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    address: "",
    area: "",
    details: "",
    isDefault: false,
  });

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          bio: data.bio || "",
          contactNumber: data.contactNumber || "",
          themePreference: data.themePreference || "light",
          status: data.status || "Online",
        });

        if (data.savedAddresses && Array.isArray(data.savedAddresses)) {
          setAddresses(data.savedAddresses);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Could not load profile information");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAddress = () => {
    if (!newAddr.address.trim()) {
      toast.error("Please enter a street address");
      return;
    }

    const created: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: newAddr.label || "Home",
      address: newAddr.address.trim(),
      area: newAddr.area.trim(),
      details: newAddr.details.trim(),
      isDefault: newAddr.isDefault || addresses.length === 0,
    };

    let updated = [...addresses];
    if (created.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }
    updated.push(created);

    setAddresses(updated);
    setNewAddr({
      label: "Home",
      address: "",
      area: "",
      details: "",
      isDefault: false,
    });
    setShowAddAddress(false);
    toast.success("Address added! Click 'Save Changes' to confirm.");
  };

  const handleDeleteAddress = (idOrIdx: string | number) => {
    const updated = addresses.filter((a, idx) => (a.id || a._id || idx) !== idOrIdx);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    toast.success("Address removed");
  };

  const handleSetDefaultAddress = (idOrIdx: string | number) => {
    const updated = addresses.map((a, idx) => ({
      ...a,
      isDefault: (a.id || a._id || idx) === idOrIdx,
    }));
    setAddresses(updated);
    toast.success("Default address updated");
  };

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          savedAddresses: addresses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile & delivery addresses updated successfully!");
      router.push("/profile");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingImage(true);

    try {
      const uploadedImageUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`;

      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profilePicture: uploadedImageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile picture");
      }

      setProfile((prev) =>
        prev ? { ...prev, profilePicture: uploadedImageUrl } : null
      );
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast.error(error.message || "Failed to update profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-orange-50/60 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/60 dark:bg-gray-950 py-10 px-4 transition-colors">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your account info and saved delivery locations</p>
            </div>
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            {profile?.profilePicture ? (
              <Image
                src={profile.profilePicture}
                alt="Profile"
                width={110}
                height={110}
                className="rounded-full object-cover border-4 border-orange-100 dark:border-gray-800 shadow"
              />
            ) : (
              <div className="w-[110px] h-[110px] bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center border-4 border-orange-50 dark:border-gray-800 shadow">
                <span className="text-orange-600 dark:text-orange-400 text-3xl font-extrabold">
                  {profile?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  {profile?.lastName?.charAt(0)?.toUpperCase() || ""}
                </span>
              </div>
            )}

            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </div>

          <label className="cursor-pointer text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
            {uploadingImage ? "Uploading..." : "Change Avatar"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureChange}
              disabled={uploadingImage}
            />
          </label>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email (Cannot be modified)
            </label>
            <input
              type="email"
              value={profile?.email || ""}
              readOnly
              className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+8801XXXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
            ></textarea>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Theme Preference
              </label>
              <select
                name="themePreference"
                value={formData.themePreference}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
              >
                <option value="Online">Online</option>
                <option value="Away">Away</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>

          {/* Saved Delivery Addresses Manager (Problem-08) */}
          <div id="addresses" className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Saved Delivery Addresses
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage multiple addresses for 1-click checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-900 hover:bg-orange-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddAddress ? "Cancel" : "Add Address"}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddress && (
              <div className="p-4 mb-4 rounded-2xl bg-orange-50/50 dark:bg-gray-800/60 border border-orange-200 dark:border-orange-900/60 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Label
                    </label>
                    <select
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office / Work</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Area / Neighborhood
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi, Gulshan"
                      value={newAddr.area}
                      onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address & House / Flat No.
                  </label>
                  <input
                    type="text"
                    placeholder="House 226/A, Road 19"
                    value={newAddr.address}
                    onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please call 10 mins before reaching"
                    value={newAddr.details}
                    onChange={(e) => setNewAddr({ ...newAddr, details: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAddr.isDefault}
                      onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    Set as default address
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Add to List
                  </button>
                </div>
              </div>
            )}

            {/* Address List */}
            <div className="space-y-2.5">
              {addresses.map((addr, idx) => {
                const key = addr.id || addr._id || idx;
                return (
                  <div
                    key={key}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                      addr.isDefault
                        ? "border-orange-400 dark:border-orange-500/70 bg-orange-50/40 dark:bg-orange-950/20"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-xs text-gray-700 dark:text-gray-300 mt-0.5">
                        {addr.label.toLowerCase() === "work" || addr.label.toLowerCase() === "office" ? (
                          <Briefcase className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Home className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{addr.address}</p>
                        {addr.area && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">Area: {addr.area}</p>
                        )}
                        {addr.details && (
                          <p className="text-[11px] text-orange-600 dark:text-orange-400 italic">
                            &ldquo;{addr.details}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(key)}
                          className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(key)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
