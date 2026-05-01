'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WishlistButton({ productId, initialWishlisted }) {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigating to the product page
    
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.wishlisted);
        router.refresh(); // Update the navbar count if necessary
      } else if (res.status === 401) {
        // User is not logged in, revert and redirect
        setIsWishlisted(previousState);
        router.push('/login');
      } else {
        setIsWishlisted(previousState);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      setIsWishlisted(previousState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 10,
        transition: 'transform 0.2s, background 0.2s',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      aria-label="Toggle Wishlist"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}
