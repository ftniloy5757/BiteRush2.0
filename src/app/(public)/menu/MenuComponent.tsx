"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Star, Clock, Filter, Sparkles, Plus, Check } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  inStock: boolean;
  isAvailable?: boolean;
  featured: boolean;
  prepTime?: string;
}

function MenuList() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const categories = ["all", "burger", "pizza", "pasta", "dessert", "drink"];

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Automatically trigger seed check on initial load to ensure data is present
        await fetch("/api/seed", { method: "POST" }).catch(() => {});
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setAllProducts(data);
        setProducts(data);

        // Initialize filters from URL params
        const category = searchParams.get("category") || "";
        const minPrice = searchParams.get("minPrice") || "";
        const maxPrice = searchParams.get("maxPrice") || "";
        const minRating = searchParams.get("minRating") || "";

        setFilters({
          category,
          minPrice,
          maxPrice,
          minRating,
        });

        applyFilters(data, { category, minPrice, maxPrice, minRating }, searchQuery);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilters = (
    productsToFilter: Product[],
    currentFilters = filters,
    query = searchQuery
  ) => {
    let filtered = [...productsToFilter];

    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === currentFilters.category.toLowerCase()
      );
    }

    if (currentFilters.minPrice) {
      filtered = filtered.filter(
        (product) => product.price >= parseFloat(currentFilters.minPrice)
      );
    }

    if (currentFilters.maxPrice) {
      filtered = filtered.filter(
        (product) => product.price <= parseFloat(currentFilters.maxPrice)
      );
    }

    if (currentFilters.minRating) {
      filtered = filtered.filter(
        (product) => product.rating >= parseFloat(currentFilters.minRating)
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    setProducts(filtered);
  };

  const handleCategorySelect = (cat: string) => {
    const newCat = cat === "all" ? "" : cat;
    const newFilters = { ...filters, category: newCat };
    setFilters(newFilters);
    applyFilters(allProducts, newFilters, searchQuery);
    const params = new URLSearchParams(searchParams.toString());
    if (newCat) params.set("category", newCat);
    else params.delete("category");
    router.push(`/menu?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(allProducts, filters, q);
  };

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = cart.findIndex((item: any) => item._id === product._id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setAddedItem(product._id);
    setTimeout(() => setAddedItem(null), 1800);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Preparing delicious menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-100 dark:bg-orange-950/40 px-3 py-1 rounded-full">
          Fresh & Hot
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
          Explore Our Menu
        </h1>
        <p className="text-sm text-gray-500">
          Handcrafted dishes cooked with love and delivered in minutes.
        </p>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="h-4 w-4 absolute left-3.5 top-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search pizza, burger, pasta, drinks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2 px-2">
        {categories.map((cat) => {
          const isActive = (!filters.category && cat === "all") || filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              {cat === "all" ? "🔥 All Items" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm">
          {error}
        </div>
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
            No dishes found
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Try clearing filters or searching with a different term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const isAvailable = product.isAvailable !== false && product.inStock;
            return (
              <div
                key={product._id}
                className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between transition-all group ${
                  !isAvailable ? "opacity-60" : ""
                }`}
              >
                <div className="relative h-48 w-full bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-yellow-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                      ⭐ Chef&apos;s Special
                    </span>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Currently Unavailable
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {product.name}
                      </h3>
                      <span className="font-extrabold text-base text-orange-600 dark:text-orange-400">
                        ৳{product.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span>{product.rating ? product.rating.toFixed(1) : "4.5"}</span>
                      {product.prepTime && (
                        <span className="text-[11px] text-gray-400 font-normal">
                          · {product.prepTime}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm ${
                        addedItem === product._id
                          ? "bg-green-600 text-white scale-105"
                          : isAvailable
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {addedItem === product._id ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating View Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/cart"
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>View Cart</span>
        </Link>
      </div>
    </div>
  );
}

export default function MenuComponent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      }
    >
      <MenuList />
    </Suspense>
  );
}