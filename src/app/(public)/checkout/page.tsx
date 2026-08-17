"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingBag, MapPin, Phone, Mail, User, FileText, ArrowRight } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    area: "Gulshan",
    phone: "",
    deliveryInstructions: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
        email: session.user.email || "",
        phone: session.user.contactNumber || "+880",
      }));
    }
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("checkoutData", JSON.stringify(formData));
    router.push("/payment");
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-orange-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Delivery Details
              </h1>
              <p className="text-sm text-gray-500">
                Step 1 of 2: Enter your address & delivery notes
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-orange-500" /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Alex Customer"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-orange-500" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. alex@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-orange-500" /> Phone Number
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+8801700000000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                The rider will call this number upon arrival.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-orange-500" /> Street Address & House/Flat No.
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="House 15, Road 5, Block B"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area / Zone
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Gulshan">Gulshan</option>
                  <option value="Banani">Banani</option>
                  <option value="Dhanmondi">Dhanmondi</option>
                  <option value="Uttara">Uttara</option>
                  <option value="Mirpur">Mirpur</option>
                  <option value="Mohakhali">Mohakhali</option>
                  <option value="Badda">Badda</option>
                </select>
              </div>
            </div>

            {/* Delivery Instructions Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-orange-500" /> Delivery Instructions (Optional)
              </label>
              <textarea
                name="deliveryInstructions"
                rows={3}
                placeholder="e.g. Please ring the doorbell twice / Leave with security gate / Call when nearby"
                value={formData.deliveryInstructions}
                onChange={handleChange}
                className="w-full border rounded-xl p-3 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Special requests for rider (gate codes, drop-off location, etc.)
              </span>
            </div>

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
