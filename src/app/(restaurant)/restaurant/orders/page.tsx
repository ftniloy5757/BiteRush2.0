"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import DishImage from "@/components/customUi/DishImage";
import { ClipboardList, Check, X, ChefHat, Bike, Clock, User, MapPin, MessageSquare } from "lucide-react";

interface OrderItem { name: string; quantity: number; image: string; price: number; }
interface Rider { _id: string; firstName: string; lastName: string; contactNumber: string; vehicleType: string; }
interface Order {
  _id: string;
  user: { firstName: string; lastName: string; email: string; contactNumber?: string; };
  orderItems: OrderItem[];
  shippingAddress: { address: string; city: string; area: string; details?: string; };
  paymentMethod: string;
  deliveryMethod: string;
  deliveryInstructions?: string;
  totalPrice: number;
  status: string;
  rider?: { firstName: string; lastName: string; contactNumber: string; vehicleType: string; };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ready_for_pickup: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  pending: "⏳ Pending", accepted: "✅ Accepted", preparing: "🍳 Preparing",
  ready_for_pickup: "📦 Ready", out_for_delivery: "🛵 Out for Delivery",
  delivered: "✅ Delivered", declined: "❌ Declined", cancelled: "🚫 Cancelled",
};

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [assigningRider, setAssigningRider] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/restaurant/orders");
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRiders = async () => {
    try {
      const res = await fetch("/api/restaurant/riders");
      const data = await res.json();
      if (Array.isArray(data)) setRiders(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchOrders(); fetchRiders(); }, []);

  const handleAction = async (orderId: string, action: string, riderId?: string) => {
    try {
      await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, riderId, estimatedDeliveryMinutes: 30 }),
      });
      setAssigningRider(null);
      await fetchOrders();
    } catch (err) { console.error(err); }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const filterTabs = ["all", "pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "declined"];

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="text-lg text-gray-500">Loading orders...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-orange-600" />
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === tab ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {tab === "all" ? `All (${orders.length})` : `${statusLabels[tab]?.split(" ")[0] || ""} ${tab.replace(/_/g, " ")} (${orders.filter((o) => o.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders found</div>
        ) : filteredOrders.map((order) => (
          <div key={order._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">#{order._id.slice(-6).toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{order.user?.firstName} {order.user?.lastName}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <span className="text-xl font-bold text-orange-600">৳{order.totalPrice}</span>
            </div>

            {/* Items */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
              {order.orderItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-w-fit">
                  <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <DishImage src={item.image} alt={item.name} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-gray-500 block">x{item.quantity} · ৳{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Address & notes */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {order.shippingAddress.address}, {order.shippingAddress.area}
              </div>
              <span>💳 {order.paymentMethod}</span>
              <span>🚚 {order.deliveryMethod}</span>
            </div>

            {order.deliveryInstructions && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-2 rounded-lg mb-3">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{order.deliveryInstructions}</span>
              </div>
            )}

            {/* Rider info */}
            {order.rider && (
              <div className="flex items-center gap-2 text-sm bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 p-2 rounded-lg mb-3">
                <Bike className="h-4 w-4" />
                <span>Rider: {order.rider.firstName} {order.rider.lastName} · {order.rider.contactNumber} · {order.rider.vehicleType}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {order.status === "pending" && (
                <>
                  <button onClick={() => handleAction(order._id, "accept")} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Check className="h-4 w-4" /> Accept
                  </button>
                  <button onClick={() => handleAction(order._id, "decline")} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <X className="h-4 w-4" /> Decline
                  </button>
                </>
              )}
              {order.status === "accepted" && (
                <button onClick={() => handleAction(order._id, "preparing")} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <ChefHat className="h-4 w-4" /> Start Preparing
                </button>
              )}
              {order.status === "preparing" && (
                <button onClick={() => handleAction(order._id, "ready_for_pickup")} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Check className="h-4 w-4" /> Mark Ready
                </button>
              )}
              {order.status === "ready_for_pickup" && !order.rider && (
                <>
                  {assigningRider === order._id ? (
                    <div className="flex gap-2 items-center flex-wrap">
                      {riders.map((rider) => (
                        <button key={rider._id} onClick={() => handleAction(order._id, "assign_rider", rider._id)}
                          className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                          <Bike className="h-3 w-3" /> {rider.firstName} ({rider.vehicleType})
                        </button>
                      ))}
                      <button onClick={() => setAssigningRider(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningRider(order._id)} className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <Bike className="h-4 w-4" /> Assign Rider
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
