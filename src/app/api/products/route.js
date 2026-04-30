import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function GET(req) {
  // Rate limit: 100 requests per 15 minutes for public endpoint
  const rateLimitCheck = createRateLimitResponse(req, null, 'default');
  if (rateLimitCheck.rateLimitExceeded) {
    return rateLimitCheck.response;
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        tierDiscounts: true
      }
    });
    
    const response = NextResponse.json(products);
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
