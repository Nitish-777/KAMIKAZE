import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// PUT /api/admin/restock — add or subtract stock
// Positive amount = add stock, negative amount = subtract stock
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, amount } = await req.json();
  if (!productId || amount === undefined || amount === null) {
    return NextResponse.json({ error: "Valid product ID and amount required" }, { status: 400 });
  }

  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount === 0) {
    return NextResponse.json({ error: "Amount must be a non-zero integer" }, { status: 400 });
  }

  // Fetch current stock to prevent going below 0
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const newStock = Math.max(0, current.stock + parsedAmount);

  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  });

  return NextResponse.json({ success: true, newStock: product.stock, adjusted: parsedAmount });
}
