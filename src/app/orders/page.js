'use client';
import { useState, useEffect } from 'react';

const statusColors = { PENDING: '#f59e0b', SHIPPED: '#3b82f6', DELIVERED: '#10b981' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1>📦 My Orders</h1>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>No orders yet. Start shopping!</p>
      ) : (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.5rem', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Order #{order.id.slice(0, 8)}</span>
                  <span style={{ margin: '0 8px', color: 'var(--color-border)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'white', background: statusColors[order.status] || '#666' }}>
                  {order.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '6px 0', borderBottom: '1px solid var(--color-bg-alt)' }}>
                    <span>{item.product?.name || 'Product'} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>₹{(item.pricePaid * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {order.paymentMode.replace(/_/g, ' ')}
                  {order.shippingCity && <span> · {order.shippingCity}, {order.shippingState}</span>}
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
