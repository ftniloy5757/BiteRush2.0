"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// If you are using NextAuth.js or any authentication provider
import { useSession } from "next-auth/react"; // Assuming you are using NextAuth.js for session handling

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

export default function OrdersPage() {
  const { data: session, status } = useSession(); // Get session data (user info)
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // If session data is available, use it, otherwise default to some placeholders
  const userId = session?.user?.id || "unknown_user";
  const userName = session?.user?.name || "Unknown";

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const parsed = savedCart ? JSON.parse(savedCart) : [];
    setOrderItems(parsed);
    setIsLoading(false);
  }, []);

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const logOrderAction = async (action: "Update" | "Cancel") => {
    try {
      await fetch("/api/order-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          actionType: action,
          orderId: orderItems[0]._id,  // Send only the first order ID
        }),
      });
    } catch (err) {
      console.error(`Failed to log order ${action}:`, err);
    }
  };

  const cancelOrder = async () => {
    localStorage.removeItem("cart");
    setOrderItems([]);
    alert("You canceled your order");
    logOrderAction("Cancel"); // Log cancellation
  };

  const updateOrder = async () => {
    // Your update logic goes here
    alert("You updated your order");
    logOrderAction("Update"); // Log update
  };

  if (isLoading) {
    return <div className="p-10 text-center">Loading your orders...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Orders</h1>

      {/* Order Tracker Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-center mb-4">Track Your Order</h2>
        <div className="w-full bg-gray-200 p-4 rounded-xl">
          <div className="flex justify-between">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full mx-auto flex items-center justify-center">1</div>
              <p className="text-sm mt-2">Order Placed</p>
            </div>
            <div className="flex-1 h-1 bg-gray-400 mt-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 text-white rounded-full mx-auto flex items-center justify-center">2</div>
              <p className="text-sm mt-2">Order is being processed</p>
            </div>
            <div className="flex-1 h-1 bg-gray-400 mt-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full mx-auto flex items-center justify-center">3</div>
              <p className="text-sm mt-2">Out for delivery</p>
            </div>
            <div className="flex-1 h-1 bg-gray-400 mt-4"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full mx-auto flex items-center justify-center">4</div>
              <p className="text-sm mt-2">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600">You haven't ordered anything yet.</p>
          <Link href="/menu" className="text-blue-500 hover:underline mt-4 block">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orderItems.map((item) => (
            <div key={item._id} className="flex items-center gap-4 p-4 border rounded shadow">
              <div className="w-20 h-20 relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="rounded object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{item.name}</h2>
                <p className="text-sm capitalize text-gray-500">{item.category}</p>
                <p className="text-sm">Quantity: {item.quantity}</p>
              </div>
              <div className="font-semibold text-right">
                ৳{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}

          {/* Update Order Button */}
          <button
            onClick={updateOrder}
            className="mt-4 inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Update Order
          </button>
        </div>
      )}

      {/* Cancel Order Button */}
      <div className="text-center mt-6">
        <button
          onClick={cancelOrder}
          className="w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Cancel Order
        </button>
      </div>
    </div>
  );
}
