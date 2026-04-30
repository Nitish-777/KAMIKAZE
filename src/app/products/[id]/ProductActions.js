'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductActions({ productId, maxStock, selectedSize }) {
  const [addingCart, setAddingCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [cartMsg, setCartMsg] = useState('');
  const router = useRouter();

  const addToCart = async () => {
    setAddingCart(true); setCartMsg('');
    const res = await fetch('/api/cart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1, size: selectedSize })
    });
    setAddingCart(false);
    if (res.ok) {
      setCartMsg('Added to cart!');
      router.refresh();
      setTimeout(() => setCartMsg(''), 2000);
    } else {
      const data = await res.json();
      if (data.error === 'Unauthorized') { router.push('/login'); }
      else setCartMsg('Failed to add');
    }
  };

  const toggleWishlist = async () => {
    const res = await fetch('/api/wishlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    if (res.ok) {
      const data = await res.json();
      setWishlisted(data.wishlisted);
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button onClick={addToCart} disabled={addingCart || maxStock === 0} className="btn-outline" style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 600 }}>
        {addingCart ? 'Adding...' : maxStock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
      </button>
      <button onClick={toggleWishlist} title="Add to Wishlist" style={{
        width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: '1.3rem',
        background: wishlisted ? '#fef2f2' : 'white', transition: 'all 0.2s'
      }}>
        {wishlisted ? '❤️' : '🤍'}
      </button>
      {cartMsg && <span style={{ fontSize: '0.85rem', color: cartMsg.includes('Added') ? '#16a34a' : '#ef4444', fontWeight: 600 }}>{cartMsg}</span>}
    </div>
  );
}
