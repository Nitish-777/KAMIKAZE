import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const metadata = { title: 'My Account | Kamikaze' };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [orderCount, cartCount, wishlistCount, addressCount] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.cartItem.count({ where: { userId: session.user.id } }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
    prisma.savedAddress.count({ where: { userId: session.user.id } }),
  ]);

  const cards = [
    { href: '/orders', icon: '📦', title: 'My Orders', desc: `${orderCount} orders`, color: '#3b82f6' },
    { href: '/cart', icon: '🛒', title: 'Cart', desc: `${cartCount} items`, color: '#10b981' },
    { href: '/wishlist', icon: '❤️', title: 'Wishlist', desc: `${wishlistCount} saved`, color: '#ef4444' },
    { href: '/account/addresses', icon: '📍', title: 'Saved Addresses', desc: `${addressCount} addresses`, color: '#f59e0b' },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Account</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>{session.user.name || session.user.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href} className="hover-lift" style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem',
            background: 'white', border: '1px solid var(--color-border)',
            borderRadius: 'var(--rounded-md)', borderLeft: `4px solid ${c.color}`
          }}>
            <span style={{ fontSize: '2rem' }}>{c.icon}</span>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '2px' }}>{c.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
