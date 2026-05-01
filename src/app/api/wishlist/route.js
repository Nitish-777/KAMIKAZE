import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true, name: true, basePrice: true,
            imageUrl: true, stock: true, color: true, fit: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('[Wishlist GET]', error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productId } = body;
  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // Check product exists first to prevent FK errors
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Toggle: if exists → remove, if not → add
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    }

    await prisma.wishlistItem.create({ data: { userId, productId } });
    return NextResponse.json({ wishlisted: true });
  } catch (error) {
    console.error('[Wishlist POST] userId:', userId, 'productId:', productId, error);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
