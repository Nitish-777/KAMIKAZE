'use client';
import { useState, useEffect } from 'react';

const statusColors = { PENDING: '#f59e0b', SHIPPED: '#3b82f6', DELIVERED: '#10b981' };

export default function AdminDashboard({ initialUsers, initialOrders }) {
  const [users, setUsers] = useState(initialUsers);
  const [orders, setOrders] = useState(initialOrders);
  const [analytics, setAnalytics] = useState(null);
  const [revenueFilter, setRevenueFilter] = useState('daily');

  useEffect(() => {
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--color-primary)' }}>Sales Revenue</h3>
                <select value={revenueFilter} onChange={e => setRevenueFilter(e.target.value)} className="input-field" style={{ padding: '4px', fontSize: '0.8rem', width: 'auto' }}>
                  <option value="daily">One Day</option>
                  <option value="weekly">One Week</option>
                  <option value="monthly">One Month</option>
                  <option value="sixMonths">6 Months</option>
                  <option value="yearly">One Year</option>
                </select>
              </div>
              <h2 style={{ fontSize: '2rem', margin: '1rem 0' }}>₹{analytics.revenue[revenueFilter]?.toFixed(2) || '0.00'}</h2>
            </div>

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
        {orders.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>No orders yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {orders.map(order => (
              <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem', background: 'var(--color-bg-alt)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Order ID</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>{order.id}</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: 'white', background: statusColors[order.status] || '#666' }}>{order.status}</span>
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Customer</p>
                  <p style={{ fontWeight: 600 }}>{order.customerName || order.user?.email}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>📞 {order.customerPhone}</p>
                  {order.customerEmail && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{order.customerEmail}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Shipping Address</p>
                  <p style={{ fontSize: '0.85rem' }}>{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
                </div>
                
                <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Items</p>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', marginBottom: '4px', paddingLeft: '8px' }}>
                      • {item.product?.name || 'Unknown Product'} (Qty: {item.quantity}, Size: {item.size})
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Amount: ₹{order.totalAmount.toFixed(2)}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Payment: {order.paymentMode.replace(/_/g, ' ')}</p>
                  </div>
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="input-field" style={{ padding: '6px', fontSize: '0.8rem' }}>
                    <option value="PENDING">Pending</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
