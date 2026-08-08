// app/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface OrderItem {
  product: {
    _id: string;
    name: string;
  };
  name: string;
  quantity: number;
  image: string;
  price: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  area: string;
  details?: string;
}

interface Order {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  deliveryMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  tipAmount: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: string;
  createdAt: string;
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push(`/sign-in?redirect=/orders/${params.id}`);
      return;
    }

    // Fetch order details if authenticated
    if (status === "authenticated") {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, params.id]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      
      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl mb-4">Order not found</p>
          <Link href="/orders" className="text-blue-500 hover:text-blue-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/orders" className="text-blue-500 hover:text-blue-700">
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Order #{order._id.substring(order._id.length - 8)}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium 
              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
            </span>
          </div>
          
          <p className="text-gray-600">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="divide-y">
            {order.orderItems.map((item, index) => (
              <div key={index} className="py-4 flex items-center">
                <div className="h-16 w-16 relative mr-4">
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    fill 
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{item.price.toFixed(2)}</p>
                  <p className="text-gray-600">
                    ৳{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Shipping Address</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.area}, {order.shippingAddress.city}</p>
              <p>Postal Code: {order.shippingAddress.postalCode}</p>
              {order.shippingAddress.details && (
                <p className="mt-2 text-gray-600">{order.shippingAddress.details}</p>
              )}
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Delivery Information</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p>
                  <span className="font-medium">Method: </span>
                  {order.deliveryMethod}
                </p>
                <p>
                  <span className="font-medium">Status: </span>
                  {order.isDelivered ? (
                    <span className="text-green-600">
                      Delivered on {new Date(order.deliveredAt!).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-yellow-600">Not yet delivered</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Payment Information</h2>
            <div className="bg-gray-50 p-4 rounded mb-6">
              <p>
                <span className="font-medium">Method: </span>
                {order.paymentMethod}
              </p>
              <p>
                <span className="font-medium">Status: </span>
                {order.isPaid ? (
                  <span className="text-green-600">
                    Paid on {new Date(order.paidAt!).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-yellow-600">Not yet paid</span>
                )}
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-3">Order Summary</h2>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between py-2">
                <span>Items:</span>
                <span>৳{order.itemsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Shipping:</span>
                <span>৳{order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Tip:</span>
                <span>৳{order.tipAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2 pt-2">
                <span>Total:</span>
                <span>৳{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}