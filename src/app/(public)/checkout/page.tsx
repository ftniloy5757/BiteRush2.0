/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''  // Full phone number including the country code (+880)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      phone: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("checkoutData", JSON.stringify(formData));
    router.push("/payment");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 overflow-hidden py-12 px-4">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1470&q=80"
          alt="checkout bg"
          className="w-full h-full object-cover opacity-30 blur-sm"
        />
      </div>

      {/* Overlay card */}
      <div className="z-10 w-full max-w-xl bg-amber-600 text-white shadow-2xl rounded-2xl p-8 space-y-6 backdrop-blur-md border border-amber-500">
        <h2 className="text-3xl font-bold text-white text-center">🛒 Checkout</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-amber-100 mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-amber-300 bg-white text-gray-900 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-100 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-amber-300 bg-white text-gray-900 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-100 mb-1">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Road & House no:"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full border border-amber-300 bg-white text-gray-900 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-100 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="+8801700000000"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              className="w-full border border-amber-300 bg-white text-gray-900 rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <small className="text-amber-200 mt-1 block">
              Please enter your full phone number, including country code (+880).
            </small>
          </div>

          <button
            type="submit"
            className="w-full bg-white hover:bg-amber-50 text-amber-700 font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}

