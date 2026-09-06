// /app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Plus, Edit2, Trash2, ArrowLeft, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  featured: boolean;
  rating: number;
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        setError("Error loading products. Please try again.");
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Check authentication (allow both admin and restaurant roles)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/admin/products");
    } else if (
      status === "authenticated" &&
      !["admin", "restaurant"].includes(session?.user?.role || "")
    ) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts(products.filter((product) => product._id !== id));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      setError("Failed to delete product. Please try again.");
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (
    status === "authenticated" &&
    !["admin", "restaurant"].includes(session?.user?.role || "")
  ) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="h-7 w-7 text-orange-500" /> Products Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total catalogue: {products.length} active dishes and drinks
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all text-sm"
        >
          <Plus className="h-4 w-4" /> Add New Dish
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dish
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 relative rounded-xl overflow-hidden shadow-sm shrink-0 border border-gray-200 dark:border-gray-800">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {product.name}
                          {product.featured && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                              <Sparkles className="h-2.5 w-2.5" /> Featured
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">ID: {product._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-extrabold text-gray-900 dark:text-gray-100">
                      ৳{product.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        product.inStock
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {product.inStock ? "✓ In Stock" : "✕ Out of Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/products/edit/${product._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold text-xs transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products found in catalogue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}