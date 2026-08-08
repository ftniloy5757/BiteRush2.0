// app/admin/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface OrderItem {
  product: string;
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
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  deliveryMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  tipAmount: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: "pending" | "processing" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const markAsPaid = async () => {
    if (!order) return;
    
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/pay`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark order as paid");
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark order as paid");
    } finally {
      setUpdating(false);
    }
  };

  const markAsDelivered = async () => {
    if (!order) return;
    
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/deliver`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark order as delivered");
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark order as delivered");
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/orders");
  };

  if (loading) return <div className="p-4">Loading order details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="p-4">
      <button 
        onClick={handleBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back to Orders
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Order {order._id}</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Customer</h3>
              <p>Name: {order.user?.firstName} {order.user?.lastName}</p>
              <p>Email: {order.user?.email}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Shipping Address</h3>
              <p>{order?.shippingAddress?.address}</p>
              <p>{order?.shippingAddress?.area}, {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}</p>
              {order?.shippingAddress?.details && <p>Details: {order?.shippingAddress?.details}</p>}
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Delivery Method</h3>
              <p>{order.deliveryMethod}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Payment Method</h3>
              <p>{order.paymentMethod}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Order Status</h3>
              <p className="capitalize">{order.status.replace(/_/g, " ")}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700">Payment Status</h3>
                <p className={order.isPaid ? "text-green-500" : "text-red-500"}>
                  {order.isPaid ? `Paid on ${new Date(order.paidAt!).toLocaleDateString()}` : "Not Paid"}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Delivery Status</h3>
                <p className={order.isDelivered ? "text-green-500" : "text-red-500"}>
                  {order.isDelivered ? `Delivered on ${new Date(order.deliveredAt!).toLocaleDateString()}` : "Not Delivered"}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">Order Date</h3>
              <p>{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex items-center border-b pb-4">
                  <div className="w-16 h-16 mr-4">
                    <Image
                     width={100}
                      height={100}
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-gray-600">
                      {item.quantity} × ${item.price.toFixed(2)} = ৳{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary and Actions */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>৳{order.itemsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>৳{order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>৳{order.taxPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip:</span>
                <span>৳{order.tipAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>৳{order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Update Status</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => updateOrderStatus("pending")}
                    disabled={order.status === "pending" || updating}
                    className={`w-full py-2 px-4 rounded ${
                      order.status === "pending" 
                        ? "bg-yellow-200 text-yellow-800" 
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    }`}
                  >
                    Pending
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus("processing")}
                    disabled={order.status === "processing" || updating}
                    className={`w-full py-2 px-4 rounded ${
                      order.status === "processing" 
                        ? "bg-blue-200 text-blue-800" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    Processing
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus("out_for_delivery")}
                    disabled={order.status === "out_for_delivery" || updating}
                    className={`w-full py-2 px-4 rounded ${
                      order.status === "out_for_delivery" 
                        ? "bg-purple-200 text-purple-800" 
                        : "bg-purple-500 hover:bg-purple-600 text-white"
                    }`}
                  >
                    Out for Delivery
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus("delivered")}
                    disabled={order.status === "delivered" || updating}
                    className={`w-full py-2 px-4 rounded ${
                      order.status === "delivered" 
                        ? "bg-green-200 text-green-800" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    Delivered
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus("cancelled")}
                    disabled={order.status === "cancelled" || updating}
                    className={`w-full py-2 px-4 rounded ${
                      order.status === "cancelled" 
                        ? "bg-red-200 text-red-800" 
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {!order.isPaid && (
                  <button
                    onClick={markAsPaid}
                    disabled={updating}
                    className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    Mark as Paid
                  </button>
                )}
                
                {!order.isDelivered && (
                  <button
                    onClick={markAsDelivered}
                    disabled={updating}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}