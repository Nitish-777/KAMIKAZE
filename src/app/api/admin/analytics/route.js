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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sixMonths = new Date();
    sixMonths.setMonth(now.getMonth() - 6);
    
    const oneYear = new Date();
    oneYear.setFullYear(now.getFullYear() - 1);

    const [
      viewsToday, viewsWeek, viewsMonth,
      purchasesToday, purchasesWeek, purchasesMonth,
      cartsToday, cartsWeek, cartsMonth,
      revDay, revWeek, revMonth, rev6Month, revYear
    ] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thisMonth } } }),
      
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: thisWeek } } }),
      prisma.analyticsEvent.count({ where: { event: 'purchase', createdAt: { gte: thisMonth } } }),
      
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: today } } }),
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: thisWeek } } }),
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: thisMonth } } }),

      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: thisWeek } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: thisMonth } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: sixMonths } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: oneYear } } })
    ]);

    return NextResponse.json({
      pageViews: { today: viewsToday, weekly: viewsWeek, monthly: viewsMonth },
      purchases: { today: purchasesToday, weekly: purchasesWeek, monthly: purchasesMonth },
      carts: { today: cartsToday, weekly: cartsWeek, monthly: cartsMonth },
      revenue: {
        daily: revDay._sum.totalAmount || 0,
        weekly: revWeek._sum.totalAmount || 0,
        monthly: revMonth._sum.totalAmount || 0,
        sixMonths: rev6Month._sum.totalAmount || 0,
        yearly: revYear._sum.totalAmount || 0
      }
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
