"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  ChefHat,
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  inStock: boolean;
  isAvailable: boolean;
  featured: boolean;
  prepTime: string;
}

const categories = ["burger", "pizza", "pasta", "dessert", "drink", "other"];

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  category: "burger",
  image: "",
  rating: 5,
  inStock: true,
  isAvailable: true,
  featured: false,
  prepTime: "15-20 min",
};

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
  pizza: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
  pasta: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
  dessert: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop",
  drink: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop",
  other: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
};

const PRESET_DISH_PHOTOS = [
  { name: "Flame-Grilled Beef Burger", category: "burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop" },
  { name: "Crispy Zinger Chicken Burger", category: "burger", url: "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?w=600&h=450&fit=crop" },
  { name: "Pepperoni Passion Pizza", category: "pizza", url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop" },
  { name: "Truffle Mushroom Pasta", category: "pasta", url: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop" },
  { name: "Belgian Lava Cake", category: "dessert", url: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop" },
  { name: "Caramel Macchiato Cooler", category: "drink", url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop" },
  { name: "Hydrabadi Biriyani", category: "other", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=450&fit=crop" },
  { name: "Chicken Shawarma Wrap", category: "other", url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop" },
];

function DishImage({ src, alt, category, name }: { src: string; alt: string; category?: string; name?: string }) {
  const defaultFallback = FALLBACK_CATEGORY_IMAGES[category || "default"] || FALLBACK_CATEGORY_IMAGES.default;
  const initialSrc = src && (src.startsWith("http") || src.startsWith("data:image/")) ? src : defaultFallback;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    if (src && (src.startsWith("http") || src.startsWith("data:image/"))) {
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
      className="object-cover"
      onError={() => {
        setCurrentSrc(defaultFallback);
      }}
    />
  );
}

export default function RestaurantMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url" | "presets">("upload");
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/restaurant/products");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle image file upload with automatic client-side compression for database storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to optimized Base64 data URL for direct database persistence
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        setFormData((prev) => ({ ...prev, image: compressedBase64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("Please enter both dish name and price.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    // Default image if omitted
    const finalImage =
      formData.image && (formData.image.startsWith("http") || formData.image.startsWith("data:image/"))
        ? formData.image
        : FALLBACK_CATEGORY_IMAGES[formData.category] || FALLBACK_CATEGORY_IMAGES.default;

    const payload = {
      ...formData,
      image: finalImage,
    };

    try {
      if (editingId) {
        const res = await fetch("/api/restaurant/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (res.ok) {
          setFeedback("Item updated successfully!");
        }
      } else {
        const res = await fetch("/api/restaurant/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setFeedback("New item added to menu and saved to database!");
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyProduct);
      await fetchProducts();

      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish from the menu?")) return;
    try {
      await fetch(`/api/restaurant/products?id=${id}`, { method: "DELETE" });
      await fetchProducts();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await fetch("/api/restaurant/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product._id,
          isAvailable: !product.isAvailable,
          inStock: !product.isAvailable,
        }),
      });
      await fetchProducts();
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const startEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      rating: product.rating,
      inStock: product.inStock,
      isAvailable: product.isAvailable,
      featured: product.featured,
      prepTime: product.prepTime || "15-20 min",
    });
    setEditingId(product._id);
    setImageMode(product.image?.startsWith("data:image/") ? "upload" : "url");
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Menu Management
            </h1>
            <p className="text-xs text-gray-500">
              Add, update and organize items available in the customer menu ({products.length} items live)
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData(emptyProduct);
            setEditingId(null);
            setImageMode("upload");
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md hover:scale-105 active:scale-95 text-xs"
        >
          <Plus className="h-4 w-4" /> Add New Item
        </button>
      </div>

      {feedback && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                  {editingId ? "Edit Menu Item" : "Add New Dish"}
                </h2>
                <p className="text-xs text-gray-500">
                  Provide dish specifications and upload picture for the customer menu
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Smoky Beef Bacon Burger"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows={2}
                  placeholder="Ingredients, flavors, spices, and preparation notes..."
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="350"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Picture Selection & Upload Section */}
              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Dish Picture
                  </label>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        imageMode === "upload"
                          ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      <Upload className="h-3 w-3 inline mr-1" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        imageMode === "url"
                          ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      <LinkIcon className="h-3 w-3 inline mr-1" /> Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("presets")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        imageMode === "presets"
                          ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-xs"
                          : "text-gray-500"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 inline mr-1" /> Presets
                    </button>
                  </div>
                </div>

                {/* Upload from Device Tab */}
                {imageMode === "upload" && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 group"
                    >
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Click or Drag to Upload Picture
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        PNG, JPG, WebP supported • Automatically optimized & saved to database
                      </p>
                    </div>
                  </div>
                )}

                {/* Image URL Tab */}
                {imageMode === "url" && (
                  <div>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                )}

                {/* Presets Tab */}
                {imageMode === "presets" && (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {PRESET_DISH_PHOTOS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, image: preset.url }));
                        }}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                          formData.image === preset.url
                            ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-95"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={preset.url}
                          alt={preset.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                          <span className="text-[9px] text-white font-semibold line-clamp-1 leading-none">
                            {preset.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Image Preview */}
                {formData.image && (
                  <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100">
                    <DishImage
                      src={formData.image}
                      alt="Preview"
                      category={formData.category}
                      name={formData.name}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                        className="bg-black/60 hover:bg-black text-white p-1 rounded-lg text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      <span>Picture Ready to Save</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prep Time */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Preparation Time
                </label>
                <input
                  type="text"
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="15-20 min"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Featured (Chef&apos;s Special)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isAvailable: e.target.checked,
                        inStock: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    In Stock & Available
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.price}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-2xl font-bold text-xs disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : editingId ? (
                  "Update Menu Item"
                ) : (
                  "Save & Add to Menu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product._id}
            className={`bg-white dark:bg-gray-900 rounded-3xl shadow-sm border overflow-hidden transition-all flex flex-col justify-between ${
              !product.isAvailable ? "opacity-60" : ""
            } ${
              product.isAvailable
                ? "border-gray-200 dark:border-gray-800 hover:shadow-md"
                : "border-red-200 dark:border-red-900/40"
            }`}
          >
            <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800">
              <DishImage
                src={product.image}
                alt={product.name}
                category={product.category}
                name={product.name}
              />
              {product.featured && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                    {product.name}
                  </h3>
                  <span className="text-base font-black text-emerald-600 shrink-0 ml-2">
                    ৳{product.price}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">
                  {product.category} · {product.prepTime}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    product.isAvailable
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                  }`}
                >
                  {product.isAvailable ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  <span>{product.isAvailable ? "In Stock" : "Unavailable"}</span>
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    title="Edit Item"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
