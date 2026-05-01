import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['WHOLESALE_PENDING', 'WHOLESALE_APPROVED', 'RETAIL'] }
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    return NextResponse.json({ success: true, updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
