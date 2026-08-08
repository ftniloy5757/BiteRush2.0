"use client";

import { useEffect, useState } from "react";

// Define the types for the order data
interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: CartItem[];
  deliveryMethod: string;
  paymentMethod: string;
  tip: number;
  subtotal: number;
  couponCode: string;
  total: number;
  couponDiscount: number;
}

export default function SuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const savedOrderData = localStorage.getItem('orderData');
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData) as OrderData);
    }
  }, []);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading order details...</p>
      </div>
    );
  }

  // Function to print or save receipt
  const generatePDF = () => {
    window.print();
  };

  // Redirect to the homepage or dashboard
  const handleGoToHome = () => {
    window.location.href = "/dashboard"; // Adjust this to the correct route for the dashboard
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-green-200 py-10">
      <div className="z-10 w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8 space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-green-700">🎉 Order Successful! 🎉</h1>
        <p className="text-lg text-center text-green-500">Thank you for your order. Here are the details:</p>

        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-green-50 rounded-xl p-6 shadow-lg border border-green-200">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">Customer Information</h2>
            <div className="mt-6">
              <p className="text-lg text-center">
                <strong className="font-medium">Customer Name:</strong> {orderData.customerName}
              </p>
              <p className="text-lg text-center">
                <strong className="font-medium">Email:</strong> {orderData.customerEmail}
              </p>
            </div>
          </div>

          {/* Items Ordered Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 text-center">Items Ordered</h3>
            <ul className="space-y-2 mt-4">
              {orderData.orderItems.map((item) => (
                <li key={item._id} className="text-lg text-gray-700 flex justify-between">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 text-center mt-4">Order Summary</h3>
            <div className="mt-4">
              <div className="flex justify-between text-lg text-gray-800">
                <span><strong>Subtotal:</strong></span>
                <span>{orderData.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-800">
                <span><strong>Delivery Fee:</strong></span>
                <span>{orderData.deliveryMethod === "Priority" ? 60 : 45}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-800">
                <span><strong>Tip:</strong></span>
                <span>{orderData.tip?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg text-gray-800">
                <span><strong>Coupon Discount:</strong></span>
                <span>{orderData.couponDiscount?.toFixed(2) || '0.00'}</span> {/* Always show coupon discount */}
              </div>
              <div className="border-t-2 my-4"></div>
              <div className="flex justify-between font-semibold text-lg text-gray-800 mt-2">
                <span><strong>Total:</strong></span>
                <span>৳{orderData.total?.toFixed(2) || '0.00'}</span> {/* Keep Taka sign only for total */}
              </div>
            </div>
          </div>
        </div>

        {/* Button to go to the home page/dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={handleGoToHome}
            className="w-full py-3 px-6 bg-orange-500 text-white rounded-md shadow-lg hover:bg-orange-600 transition-colors duration-300"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Button to download PDF */}
        <div className="mt-4 text-center">
          <button
            onClick={generatePDF}
            className="w-full py-3 px-6 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 transition-colors duration-300 font-semibold"
          >
            Print / Save Order Summary (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
