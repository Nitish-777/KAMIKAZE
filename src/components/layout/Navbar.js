import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import styles from './Navbar.module.css';

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  let cartCount = 0;
  let wishlistCount = 0;
  // Only fetch cart/wishlist counts for non-admin users
  if (session?.user?.id && !isAdmin) {
    try {
      const [cc, wc] = await Promise.all([
        prisma.cartItem.count({ where: { userId: session.user.id } }),
        prisma.wishlistItem.count({ where: { userId: session.user.id } }),
      ]);
      cartCount = cc;
      wishlistCount = wc;
    } catch {
      // Silently handle
    }
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/products" className={styles.logo}>
          <Image src="/kamikaze_logo.png" alt="Kamikaze Logo" width={40} height={40} className={styles.logoImage} priority />
          KAMIKAZE
        </Link>

        <nav className={styles.links}>
          <Link href="/products" className={styles.navLink}>Shop</Link>
          {isAdmin && (
            <>
              <Link href="/admin" className={styles.navLink}>Dashboard</Link>
              <Link href="/admin/products" className={styles.navLink}>Manage</Link>
            </>
          )}
        </nav>

        <div className={styles.actions}>
          {session ? (
            <>
              {/* Wishlist & Cart — hide for admin */}
              {!isAdmin && (
                <>
                  <Link href="/wishlist" className={styles.iconLink} title="Wishlist">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
                  </Link>
                  <Link href="/cart" className={styles.iconLink} title="Cart">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
                  </Link>
                </>
              )}

              {/* User Menu */}
              <div className={styles.userMenu}>
                <button className={styles.userBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span className={styles.userName}>{session.user.name || session.user.email?.split('@')[0]}</span>
                </button>
                <div className={styles.dropdown}>
                  {isAdmin ? (
                    <>
                      <Link href="/admin" className={styles.dropItem}>📊 Dashboard</Link>
                      <Link href="/admin/products" className={styles.dropItem}>📦 Manage Products</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/account" className={styles.dropItem}>👤 My Account</Link>
                      <Link href="/orders" className={styles.dropItem}>📦 My Orders</Link>
                      <Link href="/account/addresses" className={styles.dropItem}>📍 Saved Addresses</Link>
                      <Link href="/cart" className={styles.dropItem}>🛒 Cart</Link>
                      <Link href="/wishlist" className={styles.dropItem}>❤️ Wishlist</Link>
                    </>
                  )}
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                  <Link href="/api/auth/signout" className={styles.dropItem} style={{ color: 'var(--color-accent)' }}>🚪 Sign Out</Link>
                </div>
              </div>
            </>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
