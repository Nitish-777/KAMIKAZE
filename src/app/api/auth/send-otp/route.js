import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import { createRateLimitResponse } from "@/lib/rateLimiter";

export async function POST(req) {
  try {
    // Rate limit: 5 OTP requests per 15 min per IP
    const rateLimitCheck = createRateLimitResponse(req, null, "auth");
    if (rateLimitCheck.rateLimitExceeded) {
      return rateLimitCheck.response;
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Supabase OTP error:", error.message);
      // Don't leak Supabase error details to client
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
    if (rateLimitCheck.headers) {
      Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
