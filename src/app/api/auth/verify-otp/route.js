import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import { createRateLimitResponse } from "@/lib/rateLimiter";
import { storeOtpToken } from "@/lib/otpTokenStore";

export async function POST(req) {
  try {
    // Rate limit: 5 verification attempts per 15 min per IP
    const rateLimitCheck = createRateLimitResponse(req, null, "auth");
    if (rateLimitCheck.rateLimitExceeded) {
      return rateLimitCheck.response;
    }

    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    if (typeof token !== "string" || token.length !== 6 || !/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      console.error("Supabase verify OTP error:", error.message);

      if (error.message.includes("expired")) {
        return NextResponse.json(
          { error: "Code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // OTP verified! Generate a one-time token for NextAuth credentials flow.
    const otpToken = storeOtpToken(email.trim().toLowerCase());

    const response = NextResponse.json({
      success: true,
      otpToken,
    });
    if (rateLimitCheck.headers) {
      Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
