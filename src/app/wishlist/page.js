'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWishlist(); }, []);

  const fetchWishlist = async () => {
    const res = await fetch('/api/wishlist');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const removeItem = async (productId) => {
    await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    setItems(items.filter(i => i.productId !== productId));
  };

  const moveToCart = async (productId) => {
    await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    await removeItem(productId);
  };

  if (loading) return <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1>❤️ Wishlist</h1>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Your wishlist is empty</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid-products" style={{ marginTop: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', background: 'white' }}>
              <Link href={`/products/${item.product.id}`} style={{ display: 'block', position: 'relative', paddingTop: '100%' }}>
                <Image src={item.product.imageUrl || '/kamikaze_logo.png'} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 33vw" />
              </Link>
              <div style={{ padding: '1rem' }}>
                <Link href={`/products/${item.product.id}`} style={{ fontWeight: 600 }}>{item.product.name}</Link>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>{item.product.fit} · {item.product.color}</p>
                <p style={{ fontWeight: 700, fontSize: '1rem', margin: '6px 0' }}>₹{item.product.basePrice.toFixed(2)}</p>
                <p style={{ fontSize: '0.8rem', color: item.product.stock > 0 ? '#16a34a' : 'var(--color-accent)' }}>{item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={() => moveToCart(item.productId)} disabled={item.product.stock === 0} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Add to Cart</button>
                  <button onClick={() => removeItem(item.productId)} className="btn-outline" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
