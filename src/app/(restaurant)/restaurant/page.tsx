"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChefHat, UtensilsCrossed, ClipboardList, Headphones, TrendingUp, Package, Clock } from "lucide-react";

export default function RestaurantDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, activeOrders: 0, completedOrders: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/api/restaurant/products"),
          fetch("/api/restaurant/orders"),
        ]);
        const products = await productsRes.json();
        const orders = await ordersRes.json();

        const pending = Array.isArray(orders) ? orders.filter((o: any) => o.status === "pending").length : 0;
        const active = Array.isArray(orders) ? orders.filter((o: any) => ["accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status)).length : 0;
        const completed = Array.isArray(orders) ? orders.filter((o: any) => o.status === "delivered").length : 0;

        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          pendingOrders: pending,
          activeOrders: active,
          completedOrders: completed,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      href: "/restaurant/menu",
      icon: <UtensilsCrossed className="h-7 w-7" />,
      title: "Menu Management",
      description: "Add, edit, toggle availability of menu items",
      stat: `${stats.totalProducts} items`,
      color: "bg-emerald-500",
    },
    {
      href: "/restaurant/orders",
      icon: <ClipboardList className="h-7 w-7" />,
      title: "Order Management",
      description: "Accept, decline, prepare & dispatch orders",
      stat: `${stats.pendingOrders} pending`,
      color: "bg-orange-500",
    },
    {
      href: "/restaurant/support",
      icon: <Headphones className="h-7 w-7" />,
      title: "Support Center",
      description: "View & resolve customer support tickets",
      stat: "View tickets",
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <ChefHat className="h-10 w-10" />
          <div>
            <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
            <p className="text-emerald-100">
              Welcome back, {session?.user?.restaurantName || session?.user?.firstName || "Chef"}!
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm text-emerald-100">Total Menu</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalProducts}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm text-emerald-100">Pending</span>
            </div>
            <span className="text-2xl font-bold">{stats.pendingOrders}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm text-emerald-100">Active</span>
            </div>
            <span className="text-2xl font-bold">{stats.activeOrders}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm text-emerald-100">Delivered</span>
            </div>
            <span className="text-2xl font-bold">{stats.completedOrders}</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-600 group cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className={`${card.color} text-white p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{card.title}</h3>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{card.stat}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
