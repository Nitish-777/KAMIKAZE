import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from 'next/navigation';
import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminDashboard from "./AdminDashboard";

export const metadata = { title: 'Admin Dashboard | Kamikaze' };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const [userCount, productCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  const users = await prisma.user.findMany({
    where: { role: { in: ['WHOLESALE_PENDING', 'WHOLESALE_APPROVED'] } }
  });

  const orders = await prisma.order.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1>Admin Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
        <div style={{ padding: '1.5rem', background: 'var(--color-bg-alt)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <p className="text-muted">Total Users</p>
          <h2>{userCount}</h2>
        </div>
        <div style={{ padding: '1.5rem', background: 'var(--color-bg-alt)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <p className="text-muted">Total Products</p>
          <h2>{productCount}</h2>
        </div>
        <div style={{ padding: '1.5rem', background: 'var(--color-bg-alt)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <p className="text-muted">Total Orders</p>
          <h2>{orderCount}</h2>
        </div>
        <Link href="/admin/products" style={{ padding: '1.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Quick Action</p>
          <h3 style={{ marginTop: '0.25rem' }}>+ Add Products</h3>
        </Link>
      </div>

      <AdminDashboard initialUsers={users} initialOrders={orders} />
    </div>
  );
}
