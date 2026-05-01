import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  // Rate limit: 100 requests per 15 minutes for public endpoint
  const rateLimitCheck = createRateLimitResponse(req, null, 'default');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const session = await getServerSession(authOptions);
  let canReview = false;
  let isAuthenticated = !!session?.user?.id;

  if (session?.user?.id) {
    const deliveredOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: 'DELIVERED'
        }
      }
    });
    if (deliveredOrder) {
      canReview = true;
    }
  }

  // Reviews are always publicly visible (social proof for buyers)
  // Only WRITING reviews is restricted to delivered-order users
  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true
    }),
  ]);

  const avgRating = agg._avg.rating || 0;
  const count = agg._count;

  const response = NextResponse.json({ reviews, avgRating, count, canReview, isAuthenticated });
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

  // Rate limit: 10 reviews per hour per user
  const rateLimitCheck = createRateLimitResponse(req, session.user.id, 'reviews');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  const formData = await req.formData();
  const productId = formData.get('productId');
  const rating = parseInt(formData.get('rating'), 10);
  const comment = formData.get('comment') || '';
  const imageFile = formData.get('image');

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Valid product ID and rating (1-5) required" }, { status: 400 });
  }

  const deliveredOrder = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: session.user.id,
        status: 'DELIVERED'
      }
    }
  });

  if (!deliveredOrder) {
    return NextResponse.json({ error: "You can only review products that have been delivered to you." }, { status: 403 });
  }

  let imageUrl = null;
  if (imageFile && imageFile.size > 0) {
    const sharp = (await import('sharp')).default;
    const { writeFile, mkdir } = require('fs/promises');
    const path = require('path');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `review-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const filePath = path.join(uploadsDir, fileName);

    await sharp(buffer)
      .webp({ quality: 80 })
      .toFile(filePath);
    
    imageUrl = `/uploads/${fileName}`;
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: { rating, comment, ...(imageUrl ? { imageUrl } : {}) },
    create: { userId: session.user.id, productId, rating, comment, imageUrl }
  });

  const response = NextResponse.json(review);
  Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
