import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.savedAddress.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: 'desc' }
  });
  return NextResponse.json(addresses);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, name, phone, address, city, state, pincode, isDefault } = await req.json();
  if (!name || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // If setting as default, unset others
  if (isDefault) {
    await prisma.savedAddress.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false }
    });
  }

  const saved = await prisma.savedAddress.create({
    data: { userId: session.user.id, label: label || 'Home', name, phone, address, city, state, pincode, isDefault: !!isDefault }
  });
  return NextResponse.json(saved);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Address ID required" }, { status: 400 });

  await prisma.savedAddress.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
