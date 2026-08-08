import mongoose, { Schema, Document } from "mongoose";

export interface IOrderLog extends Document {
  userId: string;
  userName: string;
  actionType: string;
  orderId?: string;
  createdAt: Date;
}

const orderLogSchema = new Schema<IOrderLog>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    actionType: { type: String, required: true },
    orderId: { type: String },
  },
  { timestamps: true }
);

const OrderLog =
  mongoose.models.OrderLog ||
  mongoose.model<IOrderLog>("OrderLog", orderLogSchema);

export default OrderLog;
