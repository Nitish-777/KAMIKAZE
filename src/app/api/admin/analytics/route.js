import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      viewsToday, viewsWeek, viewsMonth,
      purchasesToday, purchasesWeek, purchasesMonth,
      cartsToday, cartsWeek, cartsMonth
    ] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thisMonth } } }),
      
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: thisWeek } } }),
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: thisMonth } } }),
      
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: thisWeek } } }),
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: thisMonth } } })
    ]);

    return NextResponse.json({
      pageViews: { today: viewsToday, weekly: viewsWeek, monthly: viewsMonth },
      purchases: { today: purchasesToday, weekly: purchasesWeek, monthly: purchasesMonth },
      carts: { today: cartsToday, weekly: cartsWeek, monthly: cartsMonth }
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
