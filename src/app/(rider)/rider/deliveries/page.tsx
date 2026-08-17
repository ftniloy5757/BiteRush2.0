"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Bike, MapPin, Phone, MessageSquare, CheckCircle, Clock, Star, Send, User } from "lucide-react";

interface OrderItem { name: string; quantity: number; image: string; price: number; }
interface ChatMessage { senderRole: string; senderName: string; text: string; createdAt: string; }
interface Order {
  _id: string;
  user: { firstName: string; lastName: string; contactNumber?: string; };
  orderItems: OrderItem[];
  shippingAddress: { address: string; city: string; area: string; details?: string; };
  paymentMethod: string;
  deliveryInstructions?: string;
  totalPrice: number;
  tipAmount: number;
  status: string;
  rating?: number;
  review?: string;
  messages: ChatMessage[];
  createdAt: string;
  deliveredAt?: string;
}

function RiderDeliveriesContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">(searchParams.get("tab") === "history" ? "history" : "active");
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/rider/orders");
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDeliver = async (orderId: string) => {
    if (!confirm("Confirm delivery completed?")) return;
    try {
      await fetch(`/api/rider/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delivered" }),
      });
      await fetchOrders();
    } catch (err) { console.error(err); }
  };

  const openChat = async (orderId: string) => {
    setChatOpen(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/chat`);
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatOpen) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/orders/${chatOpen}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMsg }),
      });
      const data = await res.json();
      setChatMessages(data.messages || []);
      setNewMsg("");
    } catch (err) { console.error(err); }
    finally { setSendingMsg(false); }
  };

  const activeOrders = orders.filter((o) => o.status === "out_for_delivery");
  const historyOrders = orders.filter((o) => o.status === "delivered");
  const displayOrders = tab === "active" ? activeOrders : historyOrders;

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="text-lg text-gray-500">Loading deliveries...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bike className="h-8 w-8 text-violet-600" />
        <h1 className="text-2xl font-bold">My Deliveries</h1>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("active")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "active" ? "bg-violet-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
          🛵 Active ({activeOrders.length})
        </button>
        <button onClick={() => setTab("history")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "history" ? "bg-violet-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
          ✅ History ({historyOrders.length})
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-md">
          <Bike className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{tab === "active" ? "No active deliveries" : "No delivery history yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order) => (
            <div key={order._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-lg">#{order._id.slice(-6).toUpperCase()}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <User className="h-3 w-3" />
                    <span>{order.user.firstName} {order.user.lastName}</span>
                    {order.user.contactNumber && (
                      <>
                        <Phone className="h-3 w-3" />
                        <span>{order.user.contactNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-violet-600">৳{order.totalPrice}</span>
                  {order.tipAmount > 0 && <span className="block text-xs text-emerald-600">+৳{order.tipAmount} tip</span>}
                </div>
              </div>

              {/* Items preview */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-w-fit">
                    <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <span className="text-sm">{item.name} x{item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg mb-3">
                <MapPin className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                  {order.shippingAddress.details && <p className="text-xs text-violet-500">{order.shippingAddress.details}</p>}
                  {order.deliveryInstructions && <p className="text-xs text-amber-600 mt-1">📝 {order.deliveryInstructions}</p>}
                </div>
              </div>

              {/* Rating (history) */}
              {order.status === "delivered" && order.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < order.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  {order.review && <span className="text-sm text-gray-500 italic">&ldquo;{order.review}&rdquo;</span>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {order.status === "out_for_delivery" && (
                  <>
                    <button onClick={() => handleDeliver(order._id)} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <CheckCircle className="h-4 w-4" /> Mark Delivered
                    </button>
                    <button onClick={() => openChat(order._id)} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <MessageSquare className="h-4 w-4" /> Chat
                    </button>
                  </>
                )}
                {order.status === "delivered" && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" /> Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-500" /> Chat with Customer</h3>
              <button onClick={() => setChatOpen(null)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">No messages yet. Send the first message!</p>
              ) : chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderRole === "rider" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.senderRole === "rider" ? "bg-violet-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}>
                    <p>{msg.text}</p>
                    <span className="text-[10px] opacity-70 block mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                placeholder="Type a message..." />
              <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()}
                className="bg-violet-500 hover:bg-violet-600 text-white p-2 rounded-lg disabled:opacity-50 transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiderDeliveriesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><div className="text-lg text-gray-500">Loading...</div></div>}>
      <RiderDeliveriesContent />
    </Suspense>
  );
}
