import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status } = await req.json();
  if (!orderId || !['PENDING', 'SHIPPED', 'DELIVERED'].includes(status)) {
    return NextResponse.json({ error: "Valid order ID and status required" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });

  return NextResponse.json({ success: true, order });
}
