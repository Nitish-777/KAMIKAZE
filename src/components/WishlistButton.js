'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WishlistButton({ productId, initialWishlisted }) {
  // Use null as initial state to avoid SSR/client mismatch (hydration fix)
  const [isWishlisted, setIsWishlisted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  // Set actual state only on the client after hydration
  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || isWishlisted === null) return;
    setLoading(true);

    const previousState = isWishlisted;
    setIsWishlisted(!previousState); // Optimistic update

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.wishlisted);
        showToast(data.wishlisted ? '❤️ Added to Wishlist' : '🤍 Removed from Wishlist');
        router.refresh();
      } else if (res.status === 401) {
        setIsWishlisted(previousState);
        showToast('👤 Please login to save to wishlist');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        // Log exact status to help diagnose
        const errData = await res.json().catch(() => ({}));
        console.error('[Wishlist] Error', res.status, errData);
        setIsWishlisted(previousState);
        showToast(errData.error || 'Something went wrong. Try again.');
      }
    } catch {
      setIsWishlisted(previousState);
      showToast('No internet connection. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render nothing until client hydration is complete (prevents mismatch)
  if (isWishlisted === null) return null;

  const filled = isWishlisted;

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: '56px',
            right: '8px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {toast}
        </div>
      )}

      <button
        onClick={toggleWishlist}
        disabled={loading}
        aria-label={filled ? 'Remove from Wishlist' : 'Add to Wishlist'}
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: filled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.92)',
          border: filled ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: loading ? 'wait' : 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 10,
          transition: 'transform 0.15s ease, background 0.2s ease',
          opacity: loading ? 0.6 : 1,
          backdropFilter: 'blur(4px)',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={filled ? '#ef4444' : 'none'}
          stroke={filled ? '#ef4444' : '#6b7280'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </>
  );
}
