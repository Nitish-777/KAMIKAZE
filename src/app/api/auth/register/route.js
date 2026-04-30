import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function POST(req) {
  try {
    // Rate limit: 3 registration attempts per hour per IP
    const rateLimitCheck = createRateLimitResponse(req, null, 'register');
    if (rateLimitCheck.rateLimitExceeded) {
      return rateLimitCheck.response;
    }

    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "RETAIL" }
    });

    const response = NextResponse.json({ success: true });
    Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
