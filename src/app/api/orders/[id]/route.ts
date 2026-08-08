// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import Order from '@/models/Order';
import connectDB from '@/lib/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/option';

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const params = await context.params;
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const order = await Order.findById(params.id)
      .populate('user', 'firstName lastName email')
      .populate('orderItems.product');

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the order belongs to the logged-in user or if the user is an admin
    if (
      order.user._id.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching order' },
      { status: 500 }
    );
  }
}