import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 50 requests per 15 minutes per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'cart');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { select: { id: true, name: true, basePrice: true, baseWholesalePrice: true, imageUrl: true, stock: true, color: true, size: true, fit: true } } }
  });
  
  const response = NextResponse.json(items);
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 50 requests per 15 minutes per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'cart');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const { productId, quantity = 1, size = "32" } = await req.json();
  if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId_size: { userId: session.user.id, productId, size } }
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    });
    
    const response = NextResponse.json(updated);
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const item = await prisma.cartItem.create({
    data: { userId: session.user.id, productId, quantity, size }
  });
  
  const response = NextResponse.json(item);
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 50 requests per 15 minutes per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'cart');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const { cartItemId, quantity, size } = await req.json();
  if (!cartItemId) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const updateData = {};
  if (quantity !== undefined && quantity >= 1) updateData.quantity = quantity;
  if (size !== undefined) updateData.size = size;

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId, userId: session.user.id },
    data: updateData
  });
  
  const response = NextResponse.json(updated);
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 50 requests per 15 minutes per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'cart');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const { searchParams } = new URL(req.url);
  const cartItemId = searchParams.get('id');
  const clearAll = searchParams.get('clear');

  if (clearAll === 'true') {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    const response = NextResponse.json({ success: true });
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (!cartItemId) return NextResponse.json({ error: "Cart item ID required" }, { status: 400 });

  await prisma.cartItem.delete({ where: { id: cartItemId, userId: session.user.id } });
  const response = NextResponse.json({ success: true });
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
