"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Star, Clock, Sparkles, Plus, Check } from "lucide-react";
import { INITIAL_PRODUCTS, ProductItem } from "@/lib/initialProducts";

type Product = ProductItem;

import DishImage from "@/components/customUi/DishImage";
import { toast } from "react-hot-toast";

function MenuList() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
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

  const categories = ["all", "burger", "pizza", "pasta", "dessert", "drink", "other"];

  // Fetch products from API in background, fallback to INITIAL_PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const category = searchParams.get("category") || "";
        const minPrice = searchParams.get("minPrice") || "";
        const maxPrice = searchParams.get("maxPrice") || "";
        const minRating = searchParams.get("minRating") || "";

        const currentFilterState = { category, minPrice, maxPrice, minRating };
        setFilters(currentFilterState);

        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllProducts(data);
            applyFilters(data, currentFilterState, searchQuery);
            return;
          }
        }
        applyFilters(INITIAL_PRODUCTS, currentFilterState, searchQuery);
      } catch (error) {
        console.warn("Using initial products fallback:", error);
        applyFilters(INITIAL_PRODUCTS, filters, searchQuery);
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
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q)
      );
    }

    setProducts(filtered);
  };

  const handleCategoryChange = (newCat: string) => {
    const newFilters = { ...filters, category: newCat === "all" ? "" : newCat };
    setFilters(newFilters);
    applyFilters(allProducts, newFilters, searchQuery);
    const params = new URLSearchParams(searchParams.toString());
    if (newCat && newCat !== "all") params.set("category", newCat);
    else params.delete("category");
    router.push(`/menu?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(allProducts, filters, q);
  };

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

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
    const count = cart.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
    setCartCount(count);
    setAddedItem(product._id);
    setTimeout(() => setAddedItem(null), 1800);
    toast.success(`Added ${product.name} to cart! 🛒`);
  };

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
        <p className="text-xs sm:text-sm text-gray-500">
          Handcrafted dishes cooked with love and delivered in minutes.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pizza, burger, pasta, drinks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {categories.map((cat) => {
            const active =
              (!filters.category && cat === "all") ||
              filters.category.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all capitalize ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-105"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-orange-300"
                }`}
              >
                {cat === "all" ? "🔥 All Items" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dishes Grid */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800 max-w-md mx-auto space-y-3">
          <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            No dishes found
          </h3>
          <p className="text-xs text-gray-500">
            Try clearing filters or searching with a different keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {products.map((product) => {
            const isAvailable = product.isAvailable !== false && product.inStock !== false;
            return (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div className="relative h-48 sm:h-52 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <DishImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    name={product.name}
                  />
                  {product.featured && (
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Popular
                    </span>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <span className="font-black text-sm text-orange-600 ml-2">
                        ৳{product.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {product.rating?.toFixed(1) || "4.5"}
                      </span>
                      {product.prepTime && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {product.prepTime}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${
                        addedItem === product._id
                          ? "bg-green-600 text-white scale-105"
                          : isAvailable
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-105 active:scale-95"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {addedItem === product._id ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Added
                        </>
                      ) : session ? (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add
                        </>
                      ) : (
                        <>
                          <span>Order Now</span>
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

      {/* Floating View Cart Button (Visible for both normal & incognito users whenever cart has items) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            href="/cart"
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 text-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>View Cart ({cartCount})</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function MenuComponent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MenuList />
    </Suspense>
  );
}