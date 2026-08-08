import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IProduct } from "./Product";

export interface OrderItem {
  product: mongoose.Types.ObjectId | IProduct;
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

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId | IUser;
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
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  status: "pending" | "processing" | "out_for_delivery" | "delivered" | "cancelled";
  rider?: mongoose.Types.ObjectId | IUser;
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
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      area: { type: String, required: true },
      details: { type: String },
    },
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
      enum: ["pending", "processing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;