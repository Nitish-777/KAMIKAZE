import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from 'next/navigation';
import AdminProductsClient from './AdminProductsClient';

export const metadata = { title: 'Manage Products | Admin | Kamikaze' };

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1>Manage Products</h1>

      <AdminProductsClient />
    </div>
  );
}
