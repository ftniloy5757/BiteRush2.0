// /app/menu/MenuComponent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  inStock: boolean;
  featured: boolean;
}

export default function MenuComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get categories from products
  const categories = [
    "all",
    ...new Set(allProducts.map((product) => product.category)),
  ];

  // Extract price range
  const priceRange =
    allProducts.length > 0
      ? {
          min: Math.floor(Math.min(...allProducts.map((p) => p.price))),
          max: Math.ceil(Math.max(...allProducts.map((p) => p.price))),
        }
      : { min: 0, max: 100 };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
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

        // Apply filters from URL
        applyFilters(data, { category, minPrice, maxPrice, minRating });
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const applyFilters = (
    productsToFilter: Product[],
    currentFilters = filters
  ) => {
    let filtered = [...productsToFilter];

    if (currentFilters.category && currentFilters.category !== "all") {
      filtered = filtered.filter(
        (product) => product.category === currentFilters.category
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

    setProducts(filtered);
  };

  // Debounced URL update function
  const updateURLWithFilters = useCallback(
    (updatedFilters: { [s: string]: unknown } | ArrayLike<unknown>) => {
      const params = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      router.push(`/menu?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    // Apply filters immediately to update UI
    applyFilters(allProducts, updatedFilters);

    // Debounce URL updates for price inputs to prevent page reloads while typing
    if (name === "minPrice" || name === "maxPrice") {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const newTimeout = setTimeout(() => {
        updateURLWithFilters(updatedFilters);
      }, 800); // Wait for 800ms of inactivity before updating URL

      setTypingTimeout(newTimeout);
    } else {
      // For other filters like category and rating, update URL immediately
      updateURLWithFilters(updatedFilters);
    }
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
    });
    router.push("/menu");
  };

  const addToCart = (product: Product) => {
    // Get current cart from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if product already in cart
    const existingProductIndex = cart.findIndex(
      (item: any) => item._id === product._id
    );

    if (existingProductIndex >= 0) {
      // Product exists in cart, increase quantity
      cart[existingProductIndex].quantity += 1;
    } else {
      // Add new product to cart
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    // Save updated cart
    localStorage.setItem("cart", JSON.stringify(cart));

    // Show success message
    alert(`Added ${product.name} to cart!`);
  };

  // Display star rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${
            i <= rating ? "text-yellow-500" : "text-gray-300"
          }`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Menu</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            >
              <option value="">All Categories</option>
              {categories.map(
                (cat) =>
                  cat !== "all" && (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  )
              )}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Min Price (৳)
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              min={priceRange.min}
              max={priceRange.max}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Max Price (৳)
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              min={priceRange.min}
              max={priceRange.max}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Min Rating
            </label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            >
              <option value="">Any Rating</option>
              <option value="1">★ & Above</option>
              <option value="2">★★ & Above</option>
              <option value="3">★★★ & Above</option>
              <option value="4">★★★★ & Above</option>
              <option value="5">★★★★★</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={resetFilters}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">
            No products found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.featured && (
                  <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold mb-1">{product.name}</h3>
                <div className="flex mb-2">{renderStars(product.rating)}</div>
                <p className="text-gray-600 text-sm mb-3 h-12 overflow-hidden">
                  {product.description.length > 80
                    ? `${product.description.substring(0, 80)}...`
                    : product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                  ৳{product.price.toFixed(2)}
                  </span>
                  <span className="text-sm capitalize px-2 py-1 rounded bg-gray-100">
                    {product.category}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className={`w-full py-2 px-4 rounded font-bold ${
                      product.inStock
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Cart Button */}
      <div className="fixed bottom-6 right-6">
        <Link
          href="/cart"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          View Cart
        </Link>
      </div>
    </div>
  );
}