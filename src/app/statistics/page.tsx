"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function StatisticsPage() {
  const [data, setData] = useState([
    { name: "Burger", count: 0 },
    { name: "Pizza", count: 0 },
    { name: "Drink", count: 0 },
  ]);
  const [isClient, setIsClient] = useState(false); // Prevents server-side rendering issues

  useEffect(() => {
    setIsClient(true); // Ensures the chart renders only on the client
    async function fetchStats() {
      const res = await fetch("/api/statistics");
      const stats = await res.json();
      setData([
        { name: "Burger", count: stats?.burger || 0 },
        { name: "Pizza", count: stats?.pizza || 0 },
        { name: "Drink", count: stats?.drink || 0 },
      ]);
    }

    fetchStats();
  }, []);

  if (!isClient) {
    return null; // Prevents rendering until the client-side data is ready
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-12">
      <h1 className="text-5xl font-extrabold text-white mb-8 text-shadow-lg">
        Food Statistics
      </h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-3xl w-full">
        <BarChart width={600} height={400} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#444" }} />
          <YAxis tick={{ fontSize: 14, fill: "#444" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#333", color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Bar dataKey="count" fill="#f87171" radius={[10, 10, 0, 0]} />
        </BarChart>
      </div>

      <div className="mt-10 text-white">
        <p className="text-xl">Check the popular items based on customer selections.</p>
      </div>
    </div>
  );
}
