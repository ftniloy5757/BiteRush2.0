"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  ChefHat,
  Salad,
  Users,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PostData {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  author: any;
  likes: number;
  integrityVerified: boolean;
  encryption: string;
  cryptoVersion: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "all", label: "All Posts", icon: MessageSquare },
  { value: "Food Review", label: "Food Reviews", icon: ChefHat },
  { value: "Restaurant Recommendation", label: "Recommendations", icon: ThumbsUp },
  { value: "Diet & Recipes", label: "Diet & Recipes", icon: Salad },
  { value: "General Discussion", label: "General", icon: Users },
];

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("General Discussion");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle, content: formContent, category: formCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setFormTitle("");
        setFormContent("");
        setFormCategory("General Discussion");
        fetchPosts();
      } else {
        setError(data.message || "Failed to create post");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${editingPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle, content: formContent, category: formCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingPost(null);
        setFormTitle("");
        setFormContent("");
        fetchPosts();
      } else {
        setError(data.message || "Failed to update post");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        fetchPosts();
      }
    } catch {
      // silently fail
    }
  };

  const openEditModal = (post: PostData) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormCategory(post.category);
    setError("");
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPost(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("General Discussion");
    setError("");
  };

  const isAuthor = (post: PostData) => {
    return post.author?._id === session?.user?.id || post.author === session?.user?.id;
  };

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.icon : MessageSquare;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Community Feed
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <Lock className="h-3 w-3" />
                  <span>ECC secp256k1 ElGamal Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="h-3 w-3" />
                  <span>HMAC-SHA256 Verified</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs h-10 px-5 shadow-md shadow-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Post
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.value
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">No posts yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Be the first to share something with the community!</p>
          </div>
        ) : (
          posts.map((post) => {
            const CatIcon = getCategoryIcon(post.category);
            return (
              <div
                key={post._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow">
                      {post.authorName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{post.authorName}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Integrity Badge */}
                    {post.integrityVerified ? (
                      <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        HMAC Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        <AlertTriangle className="h-3 w-3" />
                        Integrity Warning
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      <CatIcon className="h-3 w-3" />
                      {post.category}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-3">
                  <h3 className="text-base font-black text-gray-900 dark:text-gray-100">{post.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                    <Lock className="h-3 w-3" />
                    <span>ECC Decrypted • v{post.cryptoVersion}</span>
                  </div>
                  {isAuthor(post) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(post)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-600 font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingPost) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
                  {editingPost ? "Edit Post" : "Create Post"}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <Lock className="h-3 w-3" />
                  Content encrypted with ECC secp256k1 ElGamal
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingPost ? handleEdit : handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  required
                  className="h-10 text-xs rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Share your thoughts, food experiences, recipes..."
                  required
                  rows={4}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-800/50 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-800/50 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Food Review">Food Review</option>
                  <option value="Restaurant Recommendation">Restaurant Recommendation</option>
                  <option value="Diet & Recipes">Diet & Recipes</option>
                  <option value="General Discussion">General Discussion</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={submitting || !formTitle || !formContent}
                className="w-full h-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{editingPost ? "Re-encrypting & Saving..." : "Encrypting & Publishing..."}</span>
                  </div>
                ) : (
                  <span>{editingPost ? "Update Post" : "Publish Post"}</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
