"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, ChefHat } from "lucide-react";

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
  name: "", description: "", price: 0, category: "burger",
  image: "", rating: 0, inStock: true, isAvailable: true, featured: false, prepTime: "15-20 min",
};

export default function RestaurantMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await fetch("/api/restaurant/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
      } else {
        await fetch("/api/restaurant/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyProduct);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
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
        body: JSON.stringify({ id: product._id, isAvailable: !product.isAvailable, inStock: !product.isAvailable }),
      });
      await fetchProducts();
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const startEdit = (product: Product) => {
    setFormData({
      name: product.name, description: product.description, price: product.price,
      category: product.category, image: product.image, rating: product.rating,
      inStock: product.inStock, isAvailable: product.isAvailable, featured: product.featured,
      prepTime: product.prepTime || "15-20 min",
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="text-lg text-gray-500">Loading menu...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Management</h1>
        </div>
        <button
          onClick={() => { setFormData(emptyProduct); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
        >
          <Plus className="h-5 w-5" /> Add Item
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Item name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700" rows={3} placeholder="Describe the dish..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (৳)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700">
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700" placeholder="https://..." />
                {formData.image && (
                  <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden">
                    <Image src={formData.image} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prep Time</label>
                <input type="text" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700" placeholder="15-20 min" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked, inStock: e.target.checked })} />
                  <span className="text-sm">Available</span>
                </label>
              </div>
              <button onClick={handleSave} disabled={saving || !formData.name || !formData.price}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all">
                {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product._id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-md border overflow-hidden transition-all ${!product.isAvailable ? "opacity-60" : ""} ${product.isAvailable ? "border-gray-200 dark:border-gray-800" : "border-red-300 dark:border-red-800"}`}>
            <div className="relative h-40">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
              {product.featured && (
                <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">⭐ Featured</span>
              )}
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Unavailable</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{product.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">{product.category} · {product.prepTime}</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">৳{product.price}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <button onClick={() => toggleAvailability(product)} className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${product.isAvailable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                  {product.isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {product.isAvailable ? "In Stock" : "Out of Stock"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
