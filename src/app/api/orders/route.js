import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 requests per hour per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'orders');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
    orderBy: { createdAt: 'desc' }
  });
  
  const response = NextResponse.json(orders);
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 orders per hour per user
    const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'orders');
    if (rateLimitCheck.rateLimitExceeded) {
      return rateLimitCheck.response;
    }

    const body = await req.json();
    const {
      items, paymentMode,
      customerName, customerPhone, customerEmail,
      shippingAddress, shippingCity, shippingState, shippingPincode,
      fromCart
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Validate customer details
    if (!customerName?.trim()) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone.trim())) return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    if (!shippingAddress?.trim()) return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    if (!shippingCity?.trim()) return NextResponse.json({ error: "City is required" }, { status: 400 });
    if (!shippingState) return NextResponse.json({ error: "State is required" }, { status: 400 });
    if (!shippingPincode || !/^\d{6}$/.test(shippingPincode.trim())) return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 });

    const { role, id: userId } = session.user;

    if (role === 'WHOLESALE_APPROVED') {
      const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
      if (totalQty < 50) return NextResponse.json({ error: "Wholesale minimum order quantity is 50." }, { status: 400 });
    }

    // Use transaction to prevent overselling
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsRecord = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { tierDiscounts: true }
        });

        if (!product) throw new Error(`Product not found`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} left.`);

        let unitPrice = role === 'WHOLESALE_APPROVED' ? product.baseWholesalePrice : product.basePrice;

        let discountPct = 0;
        for (const tier of product.tierDiscounts) {
          if (item.quantity >= tier.minQuantity && tier.discountPct > discountPct) {
            discountPct = tier.discountPct;
          }
        }
        if (discountPct > 0) unitPrice = unitPrice - (unitPrice * (discountPct / 100));

        totalAmount += unitPrice * item.quantity;
        orderItemsRecord.push({ productId: product.id, quantity: item.quantity, pricePaid: unitPrice, size: item.size || "32" });

        // Auto-reduce stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      const customOrderId = 'ORD' + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();

      const order = await tx.order.create({
        data: {
          id: customOrderId,
          userId, totalAmount,
          paymentMode: paymentMode || "CASH_ON_DELIVERY",
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: (customerEmail || '').trim(),
          shippingAddress: shippingAddress.trim(),
          shippingCity: shippingCity.trim(),
          shippingState, shippingPincode: shippingPincode.trim(),
          items: { create: orderItemsRecord }
        }
      });

      // Clear cart if order came from cart
      if (fromCart) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return order;
    });

    const response = NextResponse.json({ success: true, orderId: result.id });
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error(error);
    const msg = error.message?.includes('Insufficient stock') || error.message?.includes('not found')
      ? error.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
