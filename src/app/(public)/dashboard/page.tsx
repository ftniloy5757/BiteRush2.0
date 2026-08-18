/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Utensils,
  Sparkles,
  Flame,
  Clock,
  Plus,
  ShoppingBag,
  ArrowRight,
  ChefHat,
  Bike,
  Star,
  CheckCircle,
} from "lucide-react";
import Chatbot from "@/components/Chatbot";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  prepTime?: string;
  inStock: boolean;
}

interface ActiveOrder {
  _id: string;
  status: string;
  totalPrice: number;
  orderItems: { name: string; quantity: number }[];
  createdAt: string;
}

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
  pizza: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
  pasta: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
  dessert: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop",
  drink: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop",
  default: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
};

function DishImage({ src, alt, category, name }: { src: string; alt: string; category?: string; name?: string }) {
  const defaultFallback = FALLBACK_CATEGORY_IMAGES[category || "default"] || FALLBACK_CATEGORY_IMAGES.default;
  const initialSrc = src && src.startsWith("http") ? src : defaultFallback;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    if (src && src.startsWith("http")) {
      setCurrentSrc(src);
    } else {
      setCurrentSrc(defaultFallback);
    }
  }, [src, defaultFallback]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      unoptimized
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => {
        setCurrentSrc(defaultFallback);
      }}
    />
  );
}

export default function DashboardGreeting() {
  const { data: session, status } = useSession();
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    personalized: Product[];
    trending: Product[];
    topCategories: string[];
  }>({ personalized: [], trending: [], topCategories: [] });
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [recRes, ordersRes] = await Promise.all([
          fetch("/api/recommendations"),
          fetch("/api/orders"),
        ]);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommendations(recData);
        }
        if (ordersRes.ok) {
          const ordData = await ordersRes.json();
          const active = (ordData.orders || []).filter((o: any) =>
            ["pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(o.status)
          );
          setActiveOrders(active);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((item: any) => item._id === product._id);
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`Added ${product.name} to cart! 🛒`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-800 space-y-4">
          <Utensils className="h-12 w-12 text-orange-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Sign in to BiteRush
          </h2>
          <p className="text-sm text-gray-500">
            Access your personalized menu, active orders, and fast delivery.
          </p>
          <Link
            href="/sign-in"
            className="inline-block w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-md text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Redirect role users to their dashboards if landed here
  if (session.user.role === "restaurant") {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md border space-y-4">
        <ChefHat className="h-16 w-16 text-emerald-600 mx-auto" />
        <h2 className="text-2xl font-bold">Restaurant Manager Account</h2>
        <p className="text-gray-500">You are logged in with the restaurant manager role.</p>
        <Link href="/restaurant" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow">
          Go to Restaurant Portal →
        </Link>
      </div>
    );
  }

  if (session.user.role === "rider") {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-md border space-y-4">
        <Bike className="h-16 w-16 text-violet-600 mx-auto" />
        <h2 className="text-2xl font-bold">Delivery Rider Account</h2>
        <p className="text-gray-500">You are logged in with the delivery rider role.</p>
        <Link href="/rider" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl shadow">
          Go to Rider Portal →
        </Link>
      </div>
    );
  }

  const firstName = session?.user?.firstName || "Foodie";
  const timeOfDay = getTimeOfDay();

  return (
    <div className="space-y-8 pb-12">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> BiteRush 2.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Good {timeOfDay}, {firstName}! 🍔
          </h1>
          <p className="text-orange-100 text-sm sm:text-base">
            Craving something delicious? Explore our curated recommendations or track active deliveries.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/menu"
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Utensils className="h-4 w-4" /> Browse Full Menu
            </Link>
            <Link
              href="/orders"
              className="bg-orange-700/60 hover:bg-orange-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm border border-white/30 transition-all flex items-center gap-1.5"
            >
              <Clock className="h-4 w-4" /> Track Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Active Orders Live Banner */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500 animate-spin" />
            Live Deliveries ({activeOrders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((ord) => (
              <Link
                key={ord._id}
                href={`/orders/${ord._id}`}
                className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      Order #{ord._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {ord.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {ord.orderItems.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-orange-600 font-bold text-xs">
                  <span>Track Live</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Recommendations Section */}
      {recommendations.personalized.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Recommended For You
              </h2>
              <p className="text-xs text-gray-500">
                Personalized based on your favorite categories ({recommendations.topCategories.join(", ")})
              </p>
            </div>
            <Link
              href="/menu"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.personalized.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between transition-all group"
              >
                <div className="relative h-44 w-full bg-gray-100">
                  <DishImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    name={product.name}
                  />
                  <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    ✨ Recommended
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {product.name}
                      </h3>
                      <span className="text-base font-extrabold text-orange-600">
                        ৳{product.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-yellow-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      {product.prepTime && (
                        <span className="text-gray-400 font-normal ml-1">
                          · {product.prepTime}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending & Featured Dishes */}
      {recommendations.trending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Popular & Trending Now
              </h2>
              <p className="text-xs text-gray-500">
                Top rated picks from BiteRush Kitchen
              </p>
            </div>
            <Link
              href="/menu"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              View Menu <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.trending.map((product) => (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between transition-all group"
              >
                <div className="relative h-44 w-full bg-gray-100">
                  <DishImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    name={product.name}
                  />
                  <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    🔥 Popular
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {product.name}
                      </h3>
                      <span className="text-base font-extrabold text-orange-600">
                        ৳{product.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-yellow-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      {product.prepTime && (
                        <span className="text-gray-400 font-normal ml-1">
                          · {product.prepTime}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Assistant Chatbot Toggle */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setChatbotVisible(!chatbotVisible)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
        >
          <span>🤖 {chatbotVisible ? "Close AI Food Assistant" : "Ask AI Food Assistant"}</span>
        </button>
      </div>

      {chatbotVisible && <Chatbot />}
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
