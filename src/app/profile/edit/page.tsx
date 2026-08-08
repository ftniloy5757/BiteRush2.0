// app/profile/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface UserProfile {
  _id: string;
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

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/user/update");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data.user);
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          bio: data.user.bio || "",
          contactNumber: data.user.contactNumber || "",
          themePreference: data.user.themePreference || "light",
          status: data.user.status || "Online",
        });
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      router.push("/profile"); // Redirect to profile view page
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
      // In a real implementation, you would upload to a service like S3 or Cloudinary
      // For demonstration, we'll simulate the upload and get a URL back

      // Simulated upload function (replace with actual upload)
      const uploadedImageUrl = await simulateImageUpload(file);

      // Update the profile picture in the backend
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

      // Update local state with new profile picture
      const data = await response.json();
      setProfile((prev) =>
        prev ? { ...prev, profilePicture: data.user.profilePicture } : null
      );
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast.error(error.message || "Failed to update profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  // Simulated image upload function (replace with actual implementation)
  const simulateImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Use the file parameter to construct the URL
        const fileName = file.name;
        resolve(`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`);
      }, 1000);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      {/* Profile Picture Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          {profile?.profilePicture ? (
            <Image
              src={profile.profilePicture}
              alt="Profile"
              width={150}
              height={150}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-[150px] h-[150px] bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-4xl">
                {profile?.firstName?.charAt(0)?.toUpperCase()}
                {profile?.lastName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}

          {uploadingImage && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
          {uploadingImage ? "Uploading..." : "Change Profile Picture"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email cannot be changed.{" "}
            {profile?.isEmailVerified ? "✓ Verified" : "Not verified"}
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number {profile?.isPhoneVerified && "✓"}
          </label>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {profile?.isPhoneVerified ? (
            <p className="text-xs text-green-500 mt-1">✓ Verified</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Not verified</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme Preference
            </label>
            <select
              name="themePreference"
              value={formData.themePreference}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Online">Online</option>
              <option value="Away">Away</option>
              <option value="Busy">Busy</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
