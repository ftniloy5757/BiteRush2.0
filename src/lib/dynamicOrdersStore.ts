import { DEMO_ORDERS, DEMO_IDS } from "./demoData";

declare global {
  // eslint-disable-next-line no-var
  var dynamicOrders: any[] | undefined;
}

if (!global.dynamicOrders) {
  global.dynamicOrders = JSON.parse(JSON.stringify(DEMO_ORDERS));
}

export const getDynamicOrders = (): any[] => {
  if (!global.dynamicOrders || global.dynamicOrders.length === 0) {
    global.dynamicOrders = JSON.parse(JSON.stringify(DEMO_ORDERS));
  }
  return global.dynamicOrders!;
};

export const getDynamicOrderById = (id: string): any | null => {
  const orders = getDynamicOrders();
  return orders.find((o) => o._id === id) || null;
};

export const addDynamicOrder = (orderData: any): any => {
  const orders = getDynamicOrders();
  const hexTimestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const randomHex = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(16, "0");
  const generatedId = (hexTimestamp + randomHex).toLowerCase();

  const newOrder = {
    _id: orderData._id || generatedId,
    user: orderData.user || {
      _id: DEMO_IDS.CUSTOMER,
      firstName: "Niloy",
      lastName: "Farhan",
      email: "customer@biterush.com",
      contactNumber: "+8801700000001",
    },
    orderItems: orderData.orderItems || [],
    shippingAddress: orderData.shippingAddress || {
      address: "House 15, Road 5, Block C",
      city: "Dhaka",
      postalCode: "1212",
      area: "Gulshan",
    },
    paymentMethod: orderData.paymentMethod || "Cash on Delivery",
    deliveryMethod: orderData.deliveryMethod || "Standard",
    deliveryInstructions: orderData.deliveryInstructions || "",
    itemsPrice: Number(orderData.itemsPrice) || 0,
    shippingPrice: Number(orderData.shippingPrice) || 45,
    tipAmount: Number(orderData.tipAmount) || 0,
    totalPrice: Number(orderData.totalPrice) || 0,
    status: orderData.status || "pending",
    isPaid: orderData.paymentMethod === "Bkash" || orderData.paymentMethod === "Card or Debit Card",
    paidAt:
      orderData.paymentMethod === "Bkash" || orderData.paymentMethod === "Card or Debit Card"
        ? new Date().toISOString()
        : undefined,
    isDelivered: false,
    messages: [],
    supportTickets: [],
    createdAt: new Date().toISOString(),
  };

  global.dynamicOrders = [newOrder, ...orders];
  return newOrder;
};

export const updateDynamicOrderStatus = (
  id: string,
  status: string,
  extra: Record<string, any> = {}
): any | null => {
  const orders = getDynamicOrders();
  const order = orders.find((o) => o._id === id);
  if (!order) return null;

  order.status = status;
  Object.assign(order, extra);

  if (status === "accepted" && !order.acceptedAt) {
    order.acceptedAt = new Date().toISOString();
  }
  if (status === "out_for_delivery" && !order.dispatchedAt) {
    order.dispatchedAt = new Date().toISOString();
  }
  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date().toISOString();
    if (order.paymentMethod === "Cash on Delivery") {
      order.isPaid = true;
      order.paidAt = new Date().toISOString();
    }
  }

  global.dynamicOrders = orders;
  return order;
};

export const addDynamicOrderMessage = (id: string, message: any): any | null => {
  const orders = getDynamicOrders();
  const order = orders.find((o) => o._id === id);
  if (!order) return null;

  if (!order.messages) order.messages = [];
  order.messages.push(message);

  global.dynamicOrders = orders;
  return message;
};

export const addDynamicOrderRating = (id: string, rating: number, review?: string): any | null => {
  const orders = getDynamicOrders();
  const order = orders.find((o) => o._id === id);
  if (!order) return null;

  order.rating = rating;
  order.review = review || "";
  order.ratedAt = new Date().toISOString();

  global.dynamicOrders = orders;
  return order;
};

export const addDynamicOrderSupportTicket = (id: string, ticket: any): any | null => {
  const orders = getDynamicOrders();
  const order = orders.find((o) => o._id === id);
  if (!order) return null;

  if (!order.supportTickets) order.supportTickets = [];
  order.supportTickets.push(ticket);

  global.dynamicOrders = orders;
  return order;
};
