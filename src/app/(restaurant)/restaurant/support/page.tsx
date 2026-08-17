"use client";

import { useEffect, useState } from "react";
import { Headphones, MessageSquare, CheckCircle } from "lucide-react";

interface SupportTicket { issueType: string; message: string; status: string; response?: string; createdAt: string; }
interface Order { _id: string; user: { firstName: string; lastName: string; }; supportTickets: SupportTicket[]; status: string; deliveredAt?: string; }

export default function RestaurantSupportPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/restaurant/orders");
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data.filter((o: Order) => o.supportTickets && o.supportTickets.length > 0));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchOrders();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="text-lg text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Headphones className="h-8 w-8 text-violet-600" />
        <h1 className="text-2xl font-bold">Support Center</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-md">
          <Headphones className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No support tickets yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold">Order #{order._id.slice(-6).toUpperCase()}</span>
                <span className="text-sm text-gray-500">{order.user?.firstName} {order.user?.lastName}</span>
              </div>
              {order.supportTickets.map((ticket, i) => (
                <div key={i} className={`p-3 rounded-lg mb-2 ${ticket.status === "open" ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.status === "open" ? <MessageSquare className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="font-medium text-sm">{ticket.issueType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === "open" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>{ticket.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.message}</p>
                  <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
