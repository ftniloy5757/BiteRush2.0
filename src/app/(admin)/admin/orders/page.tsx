// app/admin/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Eye } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders");

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "accepted":
        return "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "preparing":
        return "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "ready_for_pickup":
        return "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
      case "out_for_delivery":
        return "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "delivered":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "cancelled":
        return "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-orange-500" /> Orders Management
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Monitor real-time customer orders, deliveries, and payment settlements
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No orders found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-950/50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Placed Date
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
                        #{order._id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {order.user?.firstName} {order.user?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-extrabold text-gray-900 dark:text-gray-100">
                        ৳{order.totalPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs font-extrabold rounded-full border capitalize ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold text-xs transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}