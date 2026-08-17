"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bike, Package, Clock, CheckCircle, MapPin, Star } from "lucide-react";

export default function RiderDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ active: 0, completed: 0, totalEarnings: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/rider/orders");
        const data = await res.json();
        if (Array.isArray(data)) {
          const active = data.filter((o: any) => o.status === "out_for_delivery").length;
          const completed = data.filter((o: any) => o.status === "delivered").length;
          const earnings = data.filter((o: any) => o.status === "delivered").reduce((sum: number, o: any) => sum + (o.tipAmount || 0), 0);
          setStats({ active, completed, totalEarnings: earnings });
        }
      } catch (err) { console.error(err); }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Bike className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Rider Dashboard</h1>
            <p className="text-violet-100">Welcome, {session?.user?.firstName || "Rider"}! 🏍️</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm text-violet-100">Active</span>
            </div>
            <span className="text-2xl font-bold">{stats.active}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm text-violet-100">Completed</span>
            </div>
            <span className="text-2xl font-bold">{stats.completed}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-sm text-violet-100">Tips Earned</span>
            </div>
            <span className="text-2xl font-bold">৳{stats.totalEarnings}</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/rider/deliveries">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-200 dark:border-gray-800 hover:border-violet-300 cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-violet-500 text-white p-3 rounded-xl">
                <MapPin className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Active Deliveries</h3>
                <span className="text-sm text-violet-600">{stats.active} orders to deliver</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">View assigned deliveries, chat with customers, and mark as delivered.</p>
          </div>
        </Link>
        <Link href="/rider/deliveries?tab=history">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-200 dark:border-gray-800 hover:border-violet-300 cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500 text-white p-3 rounded-xl">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delivery History</h3>
                <span className="text-sm text-emerald-600">{stats.completed} completed</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Review past deliveries, ratings received, and earnings summary.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
