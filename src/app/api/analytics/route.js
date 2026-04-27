import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { event, page, productId, userId, sessionId, metadata } = await req.json();

    if (event === 'page_view' && page) {
      await prisma.pageView.create({
        data: { page, sessionId: sessionId || '', userId: userId || null }
      });
    }

    if (event && event !== 'page_view') {
      await prisma.analyticsEvent.create({
        data: { event, productId: productId || null, userId: userId || null, metadata: JSON.stringify(metadata || {}) }
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
