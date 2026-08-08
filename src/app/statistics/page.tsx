"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function StatisticsPage() {
  const [data, setData] = useState([
    { name: "Burger", count: 12 },
    { name: "Pizza", count: 24 },
    { name: "Pasta", count: 8 },
    { name: "Dessert", count: 15 },
    { name: "Drink", count: 19 },
  ]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function fetchStats() {
      try {
        const res = await fetch("/api/statistics");
        if (res.ok) {
          const stats = await res.json();
          setData([
            { name: "Burger", count: stats?.burger ?? 12 },
            { name: "Pizza", count: stats?.pizza ?? 24 },
            { name: "Pasta", count: stats?.pasta ?? 8 },
            { name: "Dessert", count: stats?.dessert ?? 15 },
            { name: "Drink", count: stats?.drink ?? 19 },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      }
    }

    fetchStats();
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 p-6">
        <div className="animate-pulse text-white text-2xl font-bold">
          Loading Statistics...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-500 via-amber-600 to-red-600 p-6 sm:p-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-8 text-center drop-shadow-md">
        🍕 BiteRush Food Statistics
      </h1>

      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-6 max-w-4xl w-full">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#888" }} />
              <YAxis tick={{ fontSize: 14, fill: "#888" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  borderRadius: "0.5rem",
                  color: "#fff",
                }}
                itemStyle={{ color: "#f97316" }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 text-white text-center">
        <p className="text-lg font-medium opacity-90">
          Real-time order demand analytics for top food categories.
        </p>
      </div>
    </div>
  );
}
