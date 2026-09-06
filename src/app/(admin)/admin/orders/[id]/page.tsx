// app/admin/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Truck, ShieldAlert, Check, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  image: string;
  price: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  area: string;
  details?: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  deliveryMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  tipAmount: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending Verification" },
  { value: "accepted", label: "Accepted by Kitchen" },
  { value: "preparing", label: "Preparing Food" },
  { value: "ready_for_pickup", label: "Ready for Rider" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const markAsPaid = async () => {
    if (!order) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/orders/${order._id}/pay`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as paid");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success("Order marked as paid!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update payment";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const markAsDelivered = async () => {
    if (!order) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/orders/${order._id}/deliver`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as delivered");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      toast.success("Order marked as delivered!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update delivery";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center space-y-4">
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl text-red-600">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Error Loading Order</h2>
          <p className="text-sm">{error}</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Order #{order._id.substring(0, 10)}...
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 space-y-4 transition-colors">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
              Customer & Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Customer</span>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{order.user?.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Destination</span>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {order?.shippingAddress?.address || "Delivery Address"}
                </p>
                <p className="text-xs text-gray-500">
                  {order?.shippingAddress?.area}, {order?.shippingAddress?.city}{" "}
                  {order?.shippingAddress?.postalCode}
                </p>
                {order?.shippingAddress?.details && (
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">
                    Note: {order.shippingAddress.details}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Payment</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {order.paymentMethod}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Delivery Type</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {order.deliveryMethod}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Settlement</span>
                <span
                  className={`text-xs font-bold ${
                    order.isPaid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {order.isPaid ? "✓ Paid" : "⏳ Unpaid"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Fulfillment</span>
                <span
                  className={`text-xs font-bold ${
                    order.isDelivered ? "text-emerald-600" : "text-purple-600"
                  }`}
                >
                  {order.isDelivered ? "✓ Delivered" : "🚀 En Route"}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Dishes */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4">
              Ordered Dishes ({order.orderItems.length})
            </h2>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {order.orderItems.map((item, index) => (
                <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 relative rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-100 dark:border-gray-800">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × ৳{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                    ৳{(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions & Summary */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 space-y-3 transition-colors">
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
              Order Financials
            </h3>

            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">৳{order.itemsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">৳{order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax & VAT:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">৳{order.taxPrice.toFixed(2)}</span>
              </div>
              {order.tipAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Rider Tip:</span>
                  <span className="font-semibold">৳{order.tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-gray-800 pt-3">
                <span>Total Amount:</span>
                <span className="text-orange-600 dark:text-orange-400">৳{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Admin Workflow Control */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 space-y-4 transition-colors">
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
              Update Order Status
            </h3>

            <div className="space-y-2">
              {ORDER_STATUSES.map((st) => {
                const isActive = order.status === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => updateOrderStatus(st.value)}
                    disabled={isActive || updating}
                    className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md cursor-default"
                        : "bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <span>{st.label}</span>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              {!order.isPaid && (
                <button
                  onClick={markAsPaid}
                  disabled={updating}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Payment Collected
                </button>
              )}

              {!order.isDelivered && (
                <button
                  onClick={markAsDelivered}
                  disabled={updating}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Truck className="h-4 w-4" /> Confirm Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}