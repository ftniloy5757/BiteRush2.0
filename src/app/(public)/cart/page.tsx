"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load cart items from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem("cart");
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        setCartItems(parsedCart);
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Update localStorage when cart changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isLoading]);

  // Handle quantity change
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      setCartItems([]);
    }
  };

  // Proceed to checkout
  const checkout = () => {
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading your cart...</div>
      </div>
    );
  }

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen relative">
      {/* Background Image Container (only blurred image) */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1920&q=80')`,
          backgroundPosition: "center",
          backgroundAttachment: "fixed", // Keep the background fixed as you scroll
          filter: "blur(5px)", // Apply blur only to the background image
        }}
      ></div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* "Your Cart" Heading with Orange Border and Light Blue Background */}
        <h1
          className="text-4xl font-extrabold mb-8 text-center text-black mt-[-30px] p-4"
          style={{
            backgroundColor: "#d8e7f5", // Light blue background inside
            border: "3px solid #e97f3e", // Orange border
            padding: "10px", // Padding for better spacing
            borderRadius: "12px", // Rounded corners
            display: "block", // Make the heading span the full width
            width: "100%", // Full width of the container
            maxWidth: "100%", // Full width of the container
          }}
        >
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">🛒</div>
            <p className="text-xl mb-8 text-white">Your cart is empty</p>
            <Link
              href="/menu"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center bg-white shadow-lg rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-20 h-20 relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="w-full">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                    </div>
                  </div>

                  {/* Column for price, quantity, and total */}
                  <div className="flex items-center space-x-8 w-full justify-between">
                    <div className="text-sm text-gray-900">{item.price.toFixed(2)}</div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="bg-gray-200 px-2 py-1 rounded-l"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item._id, parseInt(e.target.value) || 1)
                        }
                        className="w-12 text-center border-t border-b"
                      />
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="bg-gray-200 px-2 py-1 rounded-r"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-gray-900">
                      {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> Remove Item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-8">
              <button
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mb-4 md:mb-0"
              >
                Clear Cart
              </button>

              <div className="bg-gray-100 p-6 rounded-lg w-full md:w-96 mt-6 md:mt-0 border border-black">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                {cartItems.map((item) => (
                  <div className="flex justify-between mb-2" key={item._id}>
                    <span>{item.name}</span>
                    <span>
                      {item.quantity} × {item.price.toFixed(2)} ={" "}
                      {(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>৳{totalPrice.toFixed(2)}</span> {/* Total with "৳" sign here */}
                </div>
                <button
                  onClick={checkout}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/products"
                className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded"
              >
                ← Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
