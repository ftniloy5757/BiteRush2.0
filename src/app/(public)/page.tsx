import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { Utensils, Sparkles, Clock, ShieldCheck, Star, ArrowRight, HeartHandshake, Flame, MapPin } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    if (session.user?.role === "restaurant") {
      redirect("/restaurant");
    } else if (session.user?.role === "rider") {
      redirect("/rider");
    }
    redirect("/dashboard");
  }
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl text-white overflow-hidden shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>Fastest Food Delivery in Town</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Cravings Delivered <br className="hidden sm:block" />
                <span className="text-amber-200">Fresh & Hot.</span>
              </h1>
              <p className="text-base sm:text-lg text-orange-100 max-w-xl font-medium leading-relaxed">
                Discover sizzling burgers, artisanal wood-fired pizzas, hearty pastas and refreshing beverages prepared by top chefs and delivered straight to your doorstep in minutes.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-white text-orange-600 hover:bg-orange-50 shadow-lg transition-all"
                >
                  <Utensils className="h-4 w-4" /> Explore Full Menu
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-orange-700/60 hover:bg-orange-700 text-white border border-white/30 transition-all"
                >
                  Sign In to Order <ArrowRight className="h-4 w-4" />
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
              {/* Floating feature badge */}
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-orange-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Average 25-35 Mins</span>
                  <span className="text-[10px] text-gray-400">Live order tracking with ETA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="space-y-8 max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 dark:text-orange-400">
            Simple & Seamless
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            How BiteRush Works
          </h2>
          <p className="text-sm text-gray-500">
            From kitchen to your dining table in three easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Browse & Customize
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Explore hundreds of mouthwatering dishes across burgers, pizzas, pastas and beverages with detailed ingredient notes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Freshly Prepared
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our culinary team crafts each dish upon ordering with hygiene-sealed packing to lock in temperature and crispness.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Live Delivery & Chat
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Track your rider in real time with dynamic countdowns and direct in-app messaging until your meal arrives.
            </p>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="space-y-6 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              Popular Categories
            </h2>
            <p className="text-xs text-gray-500">Pick from our handpicked gourmet selections</p>
          </div>
          <Link href="/menu" className="text-xs font-bold text-orange-600 hover:underline">
            View All Dishes →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: "Burgers", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop", cat: "burger" },
            { name: "Pizzas", img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop", cat: "pizza" },
            { name: "Pasta", img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300&h=300&fit=crop", cat: "pasta" },
            { name: "Desserts", img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop", cat: "dessert" },
            { name: "Drinks", img: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop", cat: "drink" },
            { name: "All Dishes", img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop", cat: "all" },
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

      {/* Featured Specials Teaser */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
              <Flame className="h-4 w-4" /> Chef&apos;s Specials
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
              Trending Delicious Picks
            </h2>
          </div>
          <Link
            href="/menu"
            className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
          >
            Explore Menu <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "Smoky BBQ Bacon Cheeseburger",
              desc: "Double flame-grilled beef patties with cheddar cheese and crispy beef bacon in toasted brioche.",
              price: "৳490",
              img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
              rating: "4.9",
            },
            {
              name: "Artisanal Pepperoni Passion Pizza",
              desc: "Authentic sourdough crust topped with spicy beef pepperoni and fresh mozzarella.",
              price: "৳750",
              img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
              rating: "4.8",
            },
            {
              name: "Creamy Truffle Mushroom Fettuccine",
              desc: "Silky fettuccine with wild sautéed mushrooms, fragrant black truffle oil and parmesan.",
              price: "৳580",
              img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
              rating: "4.7",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col justify-between group"
            >
              <div className="relative h-48 w-full bg-gray-200">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {item.name}
                    </h3>
                    <span className="font-extrabold text-sm text-orange-600 ml-2">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-yellow-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                    <span>{item.rating}</span>
                  </div>
                  <Link
                    href="/menu"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    Order Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-900/40 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-7xl mx-auto">
        <div className="space-y-1">
          <ShieldCheck className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Hygiene Guaranteed</h4>
          <p className="text-xs text-gray-500">Freshly prepared & sealed tamper-proof packaging</p>
        </div>
        <div className="space-y-1">
          <Clock className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Real-Time Tracking</h4>
          <p className="text-xs text-gray-500">Live 4-stage stepper & dynamic countdown</p>
        </div>
        <div className="space-y-1">
          <HeartHandshake className="h-8 w-8 text-orange-600 mx-auto" />
          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Dedicated Support</h4>
          <p className="text-xs text-gray-500">2-way rider chat & 24h post-delivery assistance</p>
        </div>
      </div>
    </div>
  );
}
