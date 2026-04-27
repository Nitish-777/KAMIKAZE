'use client';
import { useState, useEffect } from 'react';

function StarDisplay({ rating, size = 18 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#d1d5db', fontSize: `${size}px`, lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function StarPicker({ rating, setRating }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: 'inline-flex', gap: '4px', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          style={{ color: i <= (hover || rating) ? '#f59e0b' : '#d1d5db', fontSize: '28px', lineHeight: 1, transition: 'transform 0.1s', transform: i <= (hover || rating) ? 'scale(1.15)' : 'scale(1)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    const res = await fetch(`/api/reviews?productId=${productId}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
      setCount(data.count || 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setMessage('Please select a rating'); return; }
    setSubmitting(true); setMessage('');
    const res = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, comment })
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage('Review submitted!');
      setRating(0); setComment('');
      fetchReviews();
    } else {
      const data = await res.json();
      setMessage(data.error || 'Failed to submit');
    }
  };

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2>Reviews</h2>
        {count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StarDisplay rating={avgRating} />
            <span style={{ fontWeight: 700 }}>{avgRating.toFixed(1)}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({count} reviews)</span>
          </div>
        )}
      </div>

      {/* Write Review Form */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Write a Review</p>
        <StarPicker rating={rating} setRating={setRating} />
        <textarea value={comment} onChange={e => setComment(e.target.value)} className="input-field" rows={2} placeholder="Share your experience (optional)" style={{ marginTop: '10px' }} />
        {message && <p style={{ fontSize: '0.85rem', marginTop: '6px', color: message.includes('submitted') ? '#16a34a' : '#ef4444' }}>{message}</p>}
        <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '10px', padding: '8px 20px', fontSize: '0.85rem' }}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <StarDisplay rating={r.rating} size={14} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.user?.name || r.user?.email?.split('@')[0] || 'User'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
