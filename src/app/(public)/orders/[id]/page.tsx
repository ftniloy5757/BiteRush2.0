"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChefHat,
  Bike,
  Package,
  Star,
  MessageSquare,
  Headphones,
  Send,
  ArrowLeft,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";

interface OrderItem {
  product: { _id?: string; name: string } | string;
  name: string;
  quantity: number;
  image: string;
  price: number;
}

interface ChatMessage {
  senderRole: "customer" | "rider" | "restaurant";
  senderName: string;
  text: string;
  createdAt: string;
}

interface SupportTicket {
  issueType: string;
  message: string;
  status: "open" | "resolved";
  response?: string;
  createdAt: string;
}

interface Order {
  _id: string;
  user: { firstName: string; lastName: string; email: string };
  orderItems: OrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    area: string;
    details?: string;
  };
  paymentMethod: string;
  deliveryMethod: string;
  deliveryInstructions?: string;
  itemsPrice: number;
  shippingPrice: number;
  tipAmount: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status:
    | "pending"
    | "accepted"
    | "preparing"
    | "ready_for_pickup"
    | "out_for_delivery"
    | "delivered"
    | "declined"
    | "cancelled";
  rider?: {
    firstName: string;
    lastName: string;
    contactNumber?: string;
    vehicleType?: string;
  };
  rating?: number;
  review?: string;
  ratedAt?: string;
  estimatedDeliveryMinutes?: number;
  acceptedAt?: string;
  dispatchedAt?: string;
  messages?: ChatMessage[];
  supportTickets?: SupportTicket[];
  createdAt: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Rating state
  const [ratingVal, setRatingVal] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Support ticket state
  const [ticketIssue, setTicketIssue] = useState("Missing Item");
  const [ticketMsg, setTicketMsg] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Poll order & chat
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/sign-in?redirect=/orders/${id}`);
      return;
    }

    if (authStatus === "authenticated") {
      fetchOrderDetails();
      const interval = setInterval(fetchOrderDetails, 5000);
      return () => clearInterval(interval);
    }
  }, [authStatus, id, router]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrder(data.order);
      if (data.order.messages) {
        setChatMessages(data.order.messages);
      }
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        await fetchOrderDetails();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/orders/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMsg }),
      });
      if (res.ok) {
        const d = await res.json();
        setChatMessages(d.messages);
        setNewMsg("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/orders/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingVal, review: reviewText }),
      });
      if (res.ok) {
        await fetchOrderDetails();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to submit rating");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    setSubmittingTicket(true);
    try {
      const res = await fetch(`/api/orders/${id}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType: ticketIssue, message: ticketMsg }),
      });
      if (res.ok) {
        setTicketSuccess(true);
        setTicketMsg("");
        await fetchOrderDetails();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to submit ticket");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Tracking your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-6 rounded-2xl">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
            {error || "Order not found"}
          </h2>
          <Link
            href="/orders"
            className="inline-block mt-4 text-sm font-semibold text-orange-600 hover:underline"
          >
            ← Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Stepper calculations
  const isTerminal = order.status === "declined" || order.status === "cancelled";
  const stageIndex = (() => {
    switch (order.status) {
      case "pending":
        return 0;
      case "accepted":
      case "preparing":
      case "ready_for_pickup":
        return 1;
      case "out_for_delivery":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  })();

  const stages = [
    { label: "Order Placed", desc: "Awaiting restaurant confirmation", icon: Package },
    { label: "Preparing", desc: "Chef is crafting your meal", icon: ChefHat },
    { label: "Out for Delivery", desc: "Rider on the way", icon: Bike },
    { label: "Delivered", desc: "Enjoy your meal!", icon: CheckCircle },
  ];

  // Dynamic ETA calculation
  const etaMinutes = order.estimatedDeliveryMinutes || 35;
  const orderTime = new Date(order.createdAt).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - orderTime) / 60000);
  const remainingMinutes = Math.max(0, etaMinutes - elapsedMinutes);

  // 24hr support window calculation
  const isDelivered = order.status === "delivered";
  const within24Hours = isDelivered && order.deliveredAt
    ? (now - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60) <= 24
    : false;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Orders
        </Link>
        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full">
          ID: #{order._id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Hero Live Tracker Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-orange-200 block mb-1">
                Live Order Tracking
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                {isTerminal
                  ? order.status === "declined"
                    ? "Order Declined by Restaurant"
                    : "Order Cancelled"
                  : order.status === "delivered"
                  ? "Order Delivered!"
                  : `Estimated Delivery: ~${remainingMinutes} mins`}
              </h1>
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-2">
              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-white/40"
                >
                  Cancel Order
                </button>
              )}
              {order.status === "out_for_delivery" && (
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="bg-white text-orange-600 hover:bg-orange-50 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  {chatOpen ? "Close Chat" : "Chat with Rider"}
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {!isTerminal ? (
            <div className="pt-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {stages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isDone = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                          isDone
                            ? "bg-white text-orange-600 shadow-md"
                            : isCurrent
                            ? "bg-white text-orange-600 ring-4 ring-orange-300 animate-pulse shadow-lg scale-110"
                            : "bg-white/30 text-white/70"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-xs font-bold block ${
                          isCurrent || isDone ? "text-white" : "text-white/60"
                        }`}
                      >
                        {stage.label}
                      </span>
                      <span className="text-[10px] text-orange-100 hidden sm:block">
                        {stage.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-200" />
              <div>
                <p className="text-sm font-semibold">
                  {order.status === "declined"
                    ? "The restaurant couldn't fulfill this order at this moment. You will not be charged."
                    : "You cancelled this order while it was pending."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rider Info Card (When Out for Delivery or Delivered) */}
      {order.rider && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase block">
                Assigned Delivery Rider
              </span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                {order.rider.firstName} {order.rider.lastName}
              </h3>
              <p className="text-xs text-gray-500">
                {order.rider.vehicleType || "Motorcycle"} · {order.rider.contactNumber || "Contact available in app"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {order.status === "out_for_delivery" && (
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                <MessageSquare className="h-4 w-4" /> Message
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Chat Modal Drawer */}
      {chatOpen && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-violet-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-bold text-sm">Direct Rider Chat</h3>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/80 hover:text-white text-xs font-bold"
            >
              Close
            </button>
          </div>

          <div className="p-4 max-h-64 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                No messages yet. Send a message to coordinate delivery!
              </p>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.senderRole === "customer" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs ${
                      msg.senderRole === "customer"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-70 block mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSendChatMessage}
            className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2"
          >
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Message your rider (e.g. I am waiting at the gate)..."
              className="flex-1 border rounded-xl px-3 py-2 text-xs dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !newMsg.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Post-Delivery Star Rating Section */}
      {isDelivered && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {order.rating ? "Your Review" : "Rate Your Meal & Delivery"}
          </h2>

          {order.rating ? (
            <div className="space-y-2 mt-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= order.rating!
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              {order.review && (
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  &ldquo;{order.review}&rdquo;
                </p>
              )}
              <span className="text-[11px] text-gray-400 block">
                Reviewed on {new Date(order.ratedAt || "").toLocaleDateString()}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} className="space-y-4 mt-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-transform hover:scale-110 ${
                        star <= (hoverRating || ratingVal)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-semibold text-gray-600 ml-2">
                  {ratingVal === 5
                    ? "Excellent! 😍"
                    : ratingVal === 4
                    ? "Good 🙂"
                    : ratingVal === 3
                    ? "Average 😐"
                    : "Needs Improvement 😕"}
                </span>
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your feedback on the food taste and delivery speed..."
                rows={2}
                className="w-full border rounded-xl p-3 text-sm dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submittingRating}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
              >
                {submittingRating ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 24-Hour Support Window Section */}
      {isDelivered && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Headphones className="h-5 w-5 text-violet-500" />
              Customer Support Center
            </h2>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                within24Hours
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {within24Hours ? "24h Window Active" : "Window Closed"}
            </span>
          </div>

          {/* List existing tickets */}
          {order.supportTickets && order.supportTickets.length > 0 && (
            <div className="space-y-2 mb-4">
              {order.supportTickets.map((t, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {t.issueType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        t.status === "open"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{t.message}</p>
                </div>
              ))}
            </div>
          )}

          {within24Hours ? (
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              {ticketSuccess && (
                <p className="text-xs text-green-600 font-semibold">
                  Ticket submitted! Our restaurant support team has been notified.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  className="border rounded-xl p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="Missing Item">Missing Item</option>
                  <option value="Damaged / Cold Food">Damaged / Cold Food</option>
                  <option value="Incorrect Order">Incorrect Order</option>
                  <option value="Delivery Delay">Delivery Delay</option>
                  <option value="Other">Other Issue</option>
                </select>
                <input
                  type="text"
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Describe what went wrong..."
                  required
                  className="sm:col-span-2 border rounded-xl p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <button
                type="submit"
                disabled={submittingTicket}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {submittingTicket ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-500">
              The 24-hour post-delivery support window for this order has expired. For general queries, please contact BiteRush hotline.
            </p>
          )}
        </div>
      )}

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Items in this Order
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {order.orderItems.map((item, index) => (
              <div key={index} className="py-3 flex items-center gap-3">
                <div className="h-12 w-12 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} x ৳{item.price}
                  </p>
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  ৳{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span>৳{order.itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee ({order.deliveryMethod})</span>
              <span>৳{order.shippingPrice.toFixed(2)}</span>
            </div>
            {order.tipAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Rider Tip</span>
                <span>৳{order.tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-gray-100 pt-2 border-t">
              <span>Total Amount</span>
              <span className="text-orange-600">৳{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment Info */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" /> Delivery Address
            </h2>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {order.shippingAddress.address}
              </p>
              <p>
                {order.shippingAddress.area}, {order.shippingAddress.city} -{" "}
                {order.shippingAddress.postalCode}
              </p>
            </div>
            {order.deliveryInstructions && (
              <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Delivery Note:</span>
                  <span>{order.deliveryInstructions}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              Payment Status
            </h2>
            <div className="flex justify-between">
              <span className="text-gray-500">Method:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span
                className={`font-bold ${
                  order.isPaid ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {order.isPaid ? "Paid" : "Pay upon delivery (Cash/COD)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}