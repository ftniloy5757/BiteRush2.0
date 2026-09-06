// /app/admin/products/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

const categories = ["burger", "pizza", "pasta", "dessert", "drink", "other"];

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  featured: boolean;
  rating: number;
  numReviews: number;
}

export default function EditProductPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "burger",
    image: "",
    inStock: true,
    featured: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const productId = params.id;

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const product: Product = await response.json();

        setFormData({
          name: product.name,
          description: product.description || "",
          price: product.price.toString(),
          category: product.category,
          image: product.image,
          inStock: product.inStock,
          featured: product.featured,
        });
      } catch (error) {
        setError("Error loading product. Please try again.");
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Check authentication (allow both admin and restaurant)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/sign-in?callbackUrl=/admin/products/edit/${productId}`);
    } else if (
      status === "authenticated" &&
      !["admin", "restaurant"].includes(session?.user?.role || "")
    ) {
      router.push("/unauthorized");
    }
  }, [status, session, router, productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Price must be a positive number");
      }

      const productData = {
        ...formData,
        price,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      toast.success("Dish updated successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      toast.error(error.message || "Error updating product");
      console.error("Error updating product:", error);
    } finally {
      setIsSubmitting(false);
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Edit Dish</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Update dish pricing, availability, description, or imagery
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl mb-6 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 space-y-6 transition-colors"
      >
        <div>
          <label
            className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="name"
          >
            Dish Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label
            className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="description"
          >
            Description & Ingredients *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="price"
            >
              Price in Taka (৳) *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label
              className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="category"
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 capitalize"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2"
            htmlFor="image"
          >
            Dish Image URL or Base64 *
          </label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer">
            <input
              type="checkbox"
              id="inStock"
              name="inStock"
              checked={formData.inStock}
              onChange={handleChange}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Ready / In Stock
            </span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Feature on Feed
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all text-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}