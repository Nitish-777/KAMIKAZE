'use client';
import { useState } from 'react';

const statusColors = { PENDING: '#f59e0b', SHIPPED: '#3b82f6', DELIVERED: '#10b981' };

export default function AdminDashboard({ initialUsers, initialOrders }) {
  const [users, setUsers] = useState(initialUsers);
  const [orders, setOrders] = useState(initialOrders);
  const [analytics, setAnalytics] = useState(null);

  useState(() => {
    fetch('/api/admin/analytics').then(res => res.json()).then(data => {
      if (!data.error) setAnalytics(data);
    });
  }, []);

  const handleApprove = async (userId) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'WHOLESALE_APPROVED' })
    });
    if (res.ok) setUsers(users.map(u => u.id === userId ? { ...u, role: 'WHOLESALE_APPROVED' } : u));
  };

  const updateStatus = async (orderId, status) => {
    const res = await fetch('/api/admin/orders', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    if (res.ok) setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {analytics && (
        <section>
          <h2>Analytics Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            
            <div style={{ background: 'var(--color-bg-alt)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Traffic (Page Views)</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Today:</span> <strong>{analytics.pageViews.today}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>This Week:</span> <strong>{analytics.pageViews.weekly}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>This Month:</span> <strong>{analytics.pageViews.monthly}</strong></div>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>Cart Additions</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Today:</span> <strong>{analytics.carts.today}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>This Week:</span> <strong>{analytics.carts.weekly}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>This Month:</span> <strong>{analytics.carts.monthly}</strong></div>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>Purchases</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Today:</span> <strong>{analytics.purchases.today}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>This Week:</span> <strong>{analytics.purchases.weekly}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>This Month:</span> <strong>{analytics.purchases.monthly}</strong></div>
            </div>

          </div>
        </section>
      )}

      <section>
        <h2>Wholesale Applications</h2>
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              <th>Email</th><th>Name</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 0' }}>{user.email}</td>
                <td>{user.name}</td>
                <td><span className="badge">{user.role.replace('WHOLESALE_', '')}</span></td>
                <td>
                  {user.role === 'WHOLESALE_PENDING' && (
                    <button onClick={() => handleApprove(user.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Approve</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4">No pending users.</td></tr>}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Recent Orders</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Order ID</th>
                <th style={{ padding: '10px 8px' }}>Customer</th>
                <th style={{ padding: '10px 8px' }}>Phone</th>
                <th style={{ padding: '10px 8px' }}>City</th>
                <th style={{ padding: '10px 8px' }}>Amount</th>
                <th style={{ padding: '10px 8px' }}>Payment</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.id.slice(0, 8)}...</td>
                  <td style={{ padding: '1rem 8px' }}>
                    <div style={{ fontWeight: 600 }}>{order.customerName || order.user?.email}</div>
                    {order.customerEmail && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.customerEmail}</div>}
                  </td>
                  <td style={{ padding: '1rem 8px' }}>{order.customerPhone ? `+91 ${order.customerPhone}` : '—'}</td>
                  <td style={{ padding: '1rem 8px' }}>{order.shippingCity || '—'}{order.shippingState && `, ${order.shippingState}`}</td>
                  <td style={{ padding: '1rem 8px', fontWeight: 600 }}>₹{order.totalAmount.toFixed(2)}</td>
                  <td style={{ padding: '1rem 8px', fontSize: '0.85rem' }}>{order.paymentMode.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '1rem 8px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: 'white', background: statusColors[order.status] || '#666' }}>{order.status}</span>
                  </td>
                  <td style={{ padding: '1rem 8px' }}>
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="input-field" style={{ padding: '6px', fontSize: '0.8rem', minWidth: '110px' }}>
                      <option value="PENDING">Pending</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="8">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
