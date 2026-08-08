// app/api/user/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import Order from '@/models/Order';
import { authOptions } from '../../auth/[...nextauth]/option';
import connectDB from '@/lib/dbConnect';

export async function GET(req: NextRequest) {
  try {
    await connectDB ();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find orders for the current user
    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderItems.product', 'name image');

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({ user: session.user.id });

    return NextResponse.json({
      orders,
      page,
      pages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching orders' },
      { status: 500 }
    );
  }
}