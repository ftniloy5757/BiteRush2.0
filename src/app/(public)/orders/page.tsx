"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DishImage from "@/components/customUi/DishImage";
import { ShoppingBag, Clock, ChevronRight, CheckCircle, XCircle, Bike, ChefHat, Package } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  orderItems: OrderItem[];
  deliveryMethod: string;
  paymentMethod: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Confirmation", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300", icon: CheckCircle },
  preparing: { label: "Preparing in Kitchen", color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", icon: ChefHat },
  ready_for_pickup: { label: "Ready for Pickup", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", icon: Package },
  out_for_delivery: { label: "Out for Delivery", color: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300", icon: Bike },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?redirect=/orders");
      return;
    }
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") {
      return ["pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status);
    }
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled" || o.status === "declined";
    return true;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            My Orders
          </h1>
          <p className="text-sm text-gray-500">
            Track active deliveries and view past meals
          </p>
        </div>
        <Link
          href="/menu"
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all"
        >
          + Order Food
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        {[
          { id: "all", label: `All (${orders.length})` },
          {
            id: "active",
            label: `Active (${
              orders.filter((o) =>
                [
                  "pending",
                  "accepted",
                  "preparing",
                  "ready_for_pickup",
                  "out_for_delivery",
                ].includes(o.status)
              ).length
            })`,
          },
          {
            id: "delivered",
            label: `Delivered (${orders.filter((o) => o.status === "delivered").length})`,
          },
          {
            id: "cancelled",
            label: `Cancelled (${
              orders.filter((o) => o.status === "cancelled" || o.status === "declined")
                .length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 space-y-4">
          <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto" />
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">
            No orders found
          </h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Looks like you haven&apos;t placed any orders matching this category yet.
          </p>
          <Link
            href="/menu"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const conf = statusConfig[order.status] || {
              label: order.status,
              color: "bg-gray-100 text-gray-800",
              icon: Clock,
            };
            const StatusIcon = conf.icon;

            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-800 p-5 transition-all group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${conf.color}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {conf.label}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {order.orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-1.5 pr-3 flex-shrink-0"
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <DishImage src={item.image} alt={item.name} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-right flex-shrink-0">
                    <div>
                      <span className="text-xs text-gray-400 block">Total</span>
                      <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                        ৳{order.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}