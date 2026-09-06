"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  ArrowRight,
  Home,
  Briefcase,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

interface SavedAddress {
  id?: string;
  _id?: string;
  label: string;
  address: string;
  area?: string;
  details?: string;
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("custom");
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    area: "Gulshan",
    phone: "",
    deliveryInstructions: "",
  });

  // Fetch profile to get saved addresses and auto-populate
  useEffect(() => {
    async function loadProfileAndAddresses() {
      let defaultName = "";
      let defaultEmail = "";
      let defaultPhone = "";

      if (session?.user) {
        defaultName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim();
        defaultEmail = session.user.email || "";
        defaultPhone = session.user.contactNumber || "+8801740734780";
      }

      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile.firstName || profile.lastName) {
            defaultName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
          }
          if (profile.email) defaultEmail = profile.email;
          if (profile.contactNumber) defaultPhone = profile.contactNumber;

          if (profile.savedAddresses && Array.isArray(profile.savedAddresses) && profile.savedAddresses.length > 0) {
            setSavedAddresses(profile.savedAddresses);
            const defaultAddr = profile.savedAddresses.find((a: SavedAddress) => a.isDefault) || profile.savedAddresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id || defaultAddr._id || "addr-0");
              setFormData((prev) => ({
                ...prev,
                name: defaultName || prev.name,
                email: defaultEmail || prev.email,
                phone: defaultPhone || prev.phone,
                address: defaultAddr.address || "",
                area: defaultAddr.area || "Dhanmondi",
                deliveryInstructions: defaultAddr.details || "",
              }));
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Could not load user profile addresses:", err);
      }

      const isDemo = session?.user?.email?.toLowerCase() === "customer@biterush.com";
      // Fallback auto-population from session
      setFormData((prev) => ({
        ...prev,
        name: defaultName || prev.name || (isDemo ? "Customer" : ""),
        email: defaultEmail || prev.email || (isDemo ? "customer@biterush.com" : ""),
        phone: defaultPhone || prev.phone || (isDemo ? "+8801740734780" : ""),
        address: prev.address || (isDemo ? "Dhanmondi 19 House No. 226/A" : ""),
        area: prev.area || "Dhanmondi",
      }));
    }

    loadProfileAndAddresses();
  }, [session]);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    const key = addr.id || addr._id || "";
    setSelectedAddressId(key);
    setFormData((prev) => ({
      ...prev,
      address: addr.address,
      area: addr.area || prev.area,
      deliveryInstructions: addr.details || prev.deliveryInstructions,
    }));
  };

  const handleSelectCustom = () => {
    setSelectedAddressId("custom");
    setFormData((prev) => ({
      ...prev,
      address: "",
      deliveryInstructions: "",
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If user checked "Save address to profile", save it in background
    if (saveToProfile && formData.address) {
      try {
        const newEntry: SavedAddress = {
          id: `addr-${Date.now()}`,
          label: newAddressLabel || "Saved Location",
          address: formData.address,
          area: formData.area,
          details: formData.deliveryInstructions,
          isDefault: false,
        };
        const updatedList = [...savedAddresses, newEntry];
        await fetch("/api/user/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savedAddresses: updatedList }),
        });
      } catch (err) {
        console.warn("Failed saving address to profile:", err);
      }
    }

    localStorage.setItem("checkoutData", JSON.stringify(formData));
    router.push("/payment");
  };

  return (
    <div className="min-h-screen py-10 px-4 bg-orange-50/40 dark:bg-gray-950 transition-colors">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 sm:p-8 border border-orange-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Delivery Details
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step 1 of 2: Select a saved location or enter new delivery details
              </p>
            </div>
          </div>

          {/* Quick 1-Click Saved Address Picker (Problem-08) */}
          {savedAddresses.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-50/60 dark:bg-gray-800/40 border border-orange-100 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-500" />
                Choose From Saved Addresses:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {savedAddresses.map((addr, idx) => {
                  const key = addr.id || addr._id || `addr-${idx}`;
                  const isSelected = selectedAddressId === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`text-left p-3 rounded-xl border transition-all relative ${
                        isSelected
                          ? "border-orange-500 bg-white dark:bg-gray-800 shadow-sm ring-2 ring-orange-400/40"
                          : "border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
                          {addr.label.toLowerCase() === "office" || addr.label.toLowerCase() === "work" ? (
                            <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Home className="h-3.5 w-3.5 text-orange-500" />
                          )}
                          {addr.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                        {addr.address}
                      </p>
                      {addr.area && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                          {addr.area}
                        </p>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className={`text-left p-3 rounded-xl border transition-all flex items-center gap-2 ${
                    selectedAddressId === "custom"
                      ? "border-orange-500 bg-white dark:bg-gray-800 shadow-sm ring-2 ring-orange-400/40"
                      : "border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 hover:border-orange-300"
                  }`}
                >
                  <PlusCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white">New / Custom</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px]">Type custom address</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-orange-500" /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Alex Customer"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-orange-500" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. alex@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-orange-500" /> Contact Phone Number
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+8801700000000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                The rider will call this number upon arrival with your order.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" /> Street Address & House/Flat
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="House 15, Road 5, Block B"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Area / Zone
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Dhanmondi">Dhanmondi</option>
                  <option value="Gulshan">Gulshan</option>
                  <option value="Banani">Banani</option>
                  <option value="Uttara">Uttara</option>
                  <option value="Mirpur">Mirpur</option>
                  <option value="Mohakhali">Mohakhali</option>
                  <option value="Badda">Badda</option>
                </select>
              </div>
            </div>

            {/* Delivery Instructions Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-orange-500" /> Delivery Instructions (Optional)
              </label>
              <textarea
                name="deliveryInstructions"
                rows={3}
                placeholder="e.g. Please ring doorbell twice / Call when nearby / Leave at reception"
                value={formData.deliveryInstructions}
                onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* Save Address to Profile Checkbox if custom address entered */}
            {selectedAddressId === "custom" && (
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  Save this address to my profile for future orders
                </label>

                {saveToProfile && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Label:</span>
                    <select
                      value={newAddressLabel}
                      onChange={(e) => setNewAddressLabel(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
            >
              Continue to Payment <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
