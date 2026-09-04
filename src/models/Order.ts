// src/models/Order.ts
import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IProduct } from "./Product";

export interface OrderItem {
  product: mongoose.Types.ObjectId | IProduct | string;
  name: string;
  quantity: number;
  image: string;
  price: number;
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  area: string;
  details?: string;
}

export interface ChatMessage {
  senderRole: "customer" | "rider" | "restaurant";
  senderName: string;
  text: string;
  textEncrypted?: string;
  createdAt: Date;
}

export interface SupportTicket {
  issueType: string;
  message: string;
  messageEncrypted?: string;
  status: "open" | "resolved";
  response?: string;
  responseEncrypted?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId | IUser;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingAddressEncrypted?: string;
  paymentMethod: string;
  deliveryMethod: string;
  deliveryInstructions?: string;
  deliveryInstructionsEncrypted?: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  tipAmount: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  status: "pending" | "accepted" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "delivered" | "declined" | "cancelled";
  rider?: mongoose.Types.ObjectId | IUser;
  // Rating & review
  rating?: number;
  review?: string;
  reviewEncrypted?: string;
  ratedAt?: Date;
  // Timing
  estimatedDeliveryMinutes?: number;
  acceptedAt?: Date;
  dispatchedAt?: Date;
  // Chat messages between customer and rider
  messages: ChatMessage[];
  // Support tickets
  supportTickets: SupportTicket[];
  // Cryptography metadata
  cryptoVersion: number;
  integrityMac?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      address: { type: String, default: "[ENCRYPTED]" },
      city: { type: String, default: "[ENCRYPTED]" },
      postalCode: { type: String, default: "[ENCRYPTED]" },
      area: { type: String, default: "[ENCRYPTED]" },
      details: { type: String },
    },
    shippingAddressEncrypted: String,
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash on Delivery", "Bkash", "Card or Debit Card"],
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: ["Saver", "Standard", "Priority"],
    },
    deliveryInstructions: { type: String },
    deliveryInstructionsEncrypted: String,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 45.0,
    },
    tipAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "declined", "cancelled"],
      default: "pending",
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Rating & review
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: "[ENCRYPTED]" },
    reviewEncrypted: String,
    ratedAt: { type: Date },
    // Timing
    estimatedDeliveryMinutes: { type: Number },
    acceptedAt: { type: Date },
    dispatchedAt: { type: Date },
    // Chat messages
    messages: [
      {
        senderRole: { type: String, enum: ["customer", "rider", "restaurant"], required: true },
        senderName: { type: String, required: true },
        text: { type: String, default: "[ENCRYPTED]" },
        textEncrypted: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Support tickets
    supportTickets: [
      {
        issueType: { type: String, required: true },
        message: { type: String, required: true },
        messageEncrypted: String,
        status: { type: String, enum: ["open", "resolved"], default: "open" },
        response: { type: String },
        responseEncrypted: String,
        createdAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
      },
    ],
    cryptoVersion: { type: Number, default: 1 },
    integrityMac: String,
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;