"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, Banknote, Smartphone, CheckCircle, ArrowLeft, Tag } from "lucide-react";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState("Standard");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState("+880");
  const [cardNumber, setCardNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerArea, setCustomerArea] = useState("Gulshan");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    const parsed: CartItem[] = saved ? JSON.parse(saved) : [];
    setCartItems(parsed);

    const checkoutData = localStorage.getItem("checkoutData");
    if (checkoutData) {
      const parsedData = JSON.parse(checkoutData);
      setCustomerName(parsedData.name || "");
      setCustomerEmail(parsedData.email || "");
      setMobileNumber(parsedData.phone || "+880");
      setCustomerAddress(parsedData.address || "");
      setCustomerArea(parsedData.area || "Gulshan");
      setDeliveryInstructions(parsedData.deliveryInstructions || "");
    }
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee =
    deliveryMethod === "Priority" ? 60 : deliveryMethod === "Saver" ? 30 : 45;
  const totalBeforeCoupon = subtotal + deliveryFee + tip;
  const total = Math.max(0, totalBeforeCoupon - couponDiscount);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "BITE10") {
      const discount = subtotal * 0.1;
      setCouponDiscount(discount);
      setCouponApplied(true);
    } else {
      setCouponDiscount(0);
      setCouponApplied(false);
      alert("Invalid coupon code! Try 'BITE10' for 10% off.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      router.push("/menu");
      return;
    }

    setSubmitting(true);

    const orderData = {
      orderItems: cartItems.map((item) => ({
        _id: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop",
      })),
      shippingAddress: {
        address: customerAddress || "Standard Address",
        city: "Dhaka",
        postalCode: "1200",
        area: customerArea,
        details: deliveryInstructions,
      },
      customerAddress,
      deliveryInstructions,
      deliveryMethod,
      paymentMethod,
      tip,
      subtotal,
      shippingPrice: deliveryFee,
      total,
      couponCode: couponApplied ? couponCode : undefined,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place order");
      }

      const result = await response.json();

      // Clear cart
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutData");

      // Redirect to live order tracking page
      if (result.order?._id) {
        router.push(`/orders/${result.order._id}`);
      } else {
        router.push("/orders");
      }
    } catch (error: any) {
      alert(`Error: ${error.message || "An unexpected error occurred"}`);
      console.error("Order error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Delivery Details
        </button>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment & Delivery Options (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                1. Delivery Speed
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "Saver", name: "Saver", time: "45-60 min", fee: "৳30" },
                  { id: "Standard", name: "Standard", time: "30-40 min", fee: "৳45" },
                  { id: "Priority", name: "Priority ⚡", time: "20-30 min", fee: "৳60" },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setDeliveryMethod(opt.id)}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all text-center ${
                      deliveryMethod === opt.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-bold block text-sm">{opt.name}</span>
                    <span className="text-xs text-gray-500 block mt-1">{opt.time}</span>
                    <span className="text-xs font-semibold text-orange-600 block mt-1">{opt.fee}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                2. Payment Method
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { id: "Cash on Delivery", label: "Cash on Delivery", icon: Banknote },
                  { id: "Bkash", label: "bKash / Mobile", icon: Smartphone },
                  { id: "Card or Debit Card", label: "Card / Debit", icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id)}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all text-center flex flex-col items-center justify-center gap-2 ${
                        paymentMethod === item.id
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${paymentMethod === item.id ? "text-orange-600" : "text-gray-400"}`} />
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Conditional Payment Inputs */}
              {paymentMethod === "Bkash" && (
                <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl border border-pink-200 dark:border-pink-900/30 space-y-2">
                  <label className="block text-xs font-semibold text-pink-700 dark:text-pink-300">
                    bKash Account Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="text-[11px] text-gray-500 block">
                    You will receive an OTP prompt to authorize the transaction.
                  </span>
                </div>
              )}

              {paymentMethod === "Card or Debit Card" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30 space-y-2">
                  <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <span className="text-[11px] text-gray-500 block">
                    Secured 256-bit encrypted checkout.
                  </span>
                </div>
              )}
            </div>

            {/* Tip Your Rider Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 flex items-center justify-between">
                <span>3. Tip Your Rider</span>
                <span className="text-xs font-normal text-gray-400">100% goes to your rider</span>
              </h2>
              <div className="flex items-center gap-2 mb-3">
                {[0, 15, 30, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTip(amt);
                      setCustomTip("");
                    }}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      tip === amt && customTip === ""
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {amt === 0 ? "No Tip" : `৳${amt}`}
                  </button>
                ))}
                <div className="flex items-center flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Custom ৳"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setTip(parseFloat(e.target.value) || 0);
                    }}
                    className="w-full border rounded-xl p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Column (1 column) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 sticky top-24">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Order Summary
              </h2>

              {/* Items preview */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap ml-2">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="border-t border-b border-gray-100 dark:border-gray-800 py-3 mb-4 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon (e.g. BITE10)"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs uppercase dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Coupon &apos;BITE10&apos; applied (10% off)</span>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ৳{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery ({deliveryMethod})</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ৳{deliveryFee.toFixed(2)}
                  </span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Rider Tip</span>
                    <span className="font-medium">৳{tip.toFixed(2)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-medium">-৳{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span className="text-orange-600">৳{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-98 disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : `Place Order (৳${total.toFixed(2)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
