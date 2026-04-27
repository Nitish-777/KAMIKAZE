import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, amount } = await req.json();
  if (!productId || !amount || amount < 1) {
    return NextResponse.json({ error: "Valid product ID and amount required" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: amount } }
  });

  return NextResponse.json({ success: true, newStock: product.stock });
}
