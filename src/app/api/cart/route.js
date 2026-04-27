import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { select: { id: true, name: true, basePrice: true, baseWholesalePrice: true, imageUrl: true, stock: true, color: true, size: true, fit: true } } }
  });
  return NextResponse.json(items);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity = 1 } = await req.json();
  if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } }
  });

  if (existing) {
    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    });
    return NextResponse.json(updated);
  }

  const item = await prisma.cartItem.create({
    data: { userId: session.user.id, productId, quantity }
  });
  return NextResponse.json(item);
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cartItemId, quantity } = await req.json();
  if (!cartItemId || quantity < 1) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId, userId: session.user.id },
    data: { quantity }
  });
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cartItemId = searchParams.get('id');
  const clearAll = searchParams.get('clear');

  if (clearAll === 'true') {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  }

  if (!cartItemId) return NextResponse.json({ error: "Cart item ID required" }, { status: 400 });

  await prisma.cartItem.delete({ where: { id: cartItemId, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
