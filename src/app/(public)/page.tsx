import Image from "next/image";
import Link from "next/link";
import { ChefHat, Bike, User, Utensils, Sparkles, Clock, ShieldCheck, Star, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl text-white overflow-hidden shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>Introducing BiteRush 2.0</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Delicious Food, <br className="hidden sm:block" />
                <span className="text-amber-200">Delivered Fast.</span>
              </h1>
              <p className="text-base sm:text-lg text-orange-100 max-w-xl font-medium">
                Order sizzling hot burgers, artisanal pizzas, pastas & desserts with real-time tracking, in-app rider chat, and fast delivery to your door.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-white text-orange-600 hover:bg-orange-50 shadow-lg transition-all"
                >
                  <Utensils className="h-4 w-4" /> Browse Menu
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-orange-700/60 hover:bg-orange-700 text-white border border-white/30 transition-all"
                >
                  ⚡ Try 1-Click Demo Logins <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 relative">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop"
                  alt="Delicious gourmet food feast"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating feature pills */}
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-orange-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">25 Mins Average</span>
                  <span className="text-[10px] text-gray-400">Fast & fresh delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Independent Role Modules Showcase */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 dark:text-orange-400">
            Unified Ecosystem
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Three Dedicated Role Modules
          </h2>
          <p className="text-sm text-gray-500">
            Test any module instantly with pre-configured 1-click demo profiles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Customer Module</h3>
              <p className="text-xs text-gray-500 mt-1">
                Personalized food feed based on order history, 4-stage live delivery tracker with ETA, in-app rider chat, star ratings, and 24h support tickets.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline gap-1 pt-2"
            >
              Test Customer Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Restaurant */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Restaurant Module</h3>
              <p className="text-xs text-gray-500 mt-1">
                Full menu CRUD with availability toggling, incoming order management (accept, decline, food prep), rider dispatch, and customer support resolver.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex items-center text-xs font-bold text-emerald-600 hover:underline gap-1 pt-2"
            >
              Test Restaurant Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Rider */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Rider Module</h3>
              <p className="text-xs text-gray-500 mt-1">
                Assigned delivery dashboard, turn-by-turn customer address notes, live 2-way chat with customers, delivery completion, and tip tracking.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex items-center text-xs font-bold text-violet-600 hover:underline gap-1 pt-2"
            >
              Test Rider Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              Popular Categories
            </h2>
            <p className="text-xs text-gray-500">Explore meals by cravings</p>
          </div>
          <Link href="/menu" className="text-xs font-bold text-orange-600 hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: "Burgers", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop", cat: "burger" },
            { name: "Pizzas", img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop", cat: "pizza" },
            { name: "Pasta", img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300&h=300&fit=crop", cat: "pasta" },
            { name: "Desserts", img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop", cat: "dessert" },
            { name: "Drinks", img: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop", cat: "drink" },
            { name: "Specials", img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop", cat: "all" },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/menu?category=${cat.cat}`}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden bg-orange-100">
                <Image src={cat.img} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-900/40 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="space-y-1">
          <ShieldCheck className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Quality Guaranteed</h4>
          <p className="text-xs text-gray-500">Freshly prepared & sealed hygiene packing</p>
        </div>
        <div className="space-y-1">
          <Clock className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Real-Time Tracking</h4>
          <p className="text-xs text-gray-500">Live 4-stage stepper & dynamic countdown</p>
        </div>
        <div className="space-y-1">
          <Star className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">24/7 Dedicated Support</h4>
          <p className="text-xs text-gray-500">In-app chat with rider & 24h issue resolution</p>
        </div>
      </div>
    </div>
  );
}
