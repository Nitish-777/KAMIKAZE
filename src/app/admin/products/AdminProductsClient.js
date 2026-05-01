'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './AdminProducts.module.css';

const STATUS_CONFIG = {
  NORMAL:    { label: 'Normal',    color: '#6b7280', emoji: '📦' },
  FEATURED:  { label: 'Featured',  color: '#d97706', emoji: '⭐' },
  SPONSORED: { label: 'Sponsored', color: '#7c3aed', emoji: '🚀' },
};

export default function AdminProductsClient() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [restocking, setRestocking] = useState(null);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', description: '', category: 'Jeans', color: 'Blue',
    size: '32', fit: 'Regular', gender: 'Unisex', displayStatus: 'NORMAL',
    basePrice: '', baseWholesalePrice: '', stock: '', imageUrl: '', salePrice: ''
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      showMessage('error', 'Failed to fetch products');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    if (fileRef.current?.files?.[0]) {
      formData.append('image', fileRef.current.files[0]);
    }

    const res = await fetch('/api/admin/products', { method: 'POST', body: formData });

    if (res.ok) {
      showMessage('success', 'Product added successfully!');
      setForm({ name: '', description: '', category: 'Jeans', color: 'Blue', size: '32', fit: 'Regular', gender: 'Unisex', displayStatus: 'NORMAL', basePrice: '', baseWholesalePrice: '', stock: '', imageUrl: '', salePrice: '' });
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);
      fetchProducts();
    } else {
      const data = await res.json();
      showMessage('error', data.error || 'Failed to add product');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const previousProducts = [...products];
    const previousTotal = total;

    setDeletingIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 300);

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'Product deleted');
        const newTotal = previousTotal - 1;
        const newPages = Math.ceil(newTotal / 20) || 1;
        setPages(newPages);
        if (page > newPages) setPage(newPages);
      } else {
        setProducts(previousProducts);
        setTotal(previousTotal);
        showMessage('error', 'Failed to delete product.');
      }
    } catch {
      setProducts(previousProducts);
      setTotal(previousTotal);
      showMessage('error', 'Network error. Product not deleted.');
    }
  };

  // Add or subtract stock (positive = add, negative = subtract)
  const handleStockAdjust = async (productId, amount) => {
    setRestocking(productId);
    const res = await fetch('/api/admin/restock', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, amount })
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: data.newStock } : p));
      showMessage('success', `Stock ${amount > 0 ? 'added' : 'reduced'}: ${amount > 0 ? '+' : ''}${amount} → ${data.newStock} units`);
    } else {
      showMessage('error', 'Failed to adjust stock');
    }
    setRestocking(null);
  };

  // Update display status (NORMAL / FEATURED / SPONSORED)
  const handleStatusChange = async (productId, newStatus) => {
    setUpdatingIds(prev => new Set(prev).add(productId));
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, displayStatus: newStatus })
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, displayStatus: data.product.displayStatus } : p));
      showMessage('success', `Status updated to ${newStatus}`);
    } else {
      showMessage('error', 'Failed to update status');
    }
    setUpdatingIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
  };

  // Update sale price (null to remove sale)
  const handleSalePriceUpdate = async (productId, salePrice) => {
    setUpdatingIds(prev => new Set(prev).add(productId));
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, salePrice: salePrice || null })
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, salePrice: data.product.salePrice } : p));
      showMessage('success', salePrice ? `Sale price set to ₹${salePrice}` : 'Sale price removed');
    } else {
      const errData = await res.json();
      showMessage('error', errData.error || 'Failed to update sale price');
    }
    setUpdatingIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
  };

  return (
    <div>
      {/* Toast */}
      {message && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="text" className="input-field" placeholder="Search products..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: '300px' }}
        />
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add New Product'}
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.addForm}>
          <h3>Add New Product</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                <option>Jeans</option><option>Shorts</option><option>Jackets</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Display Status</label>
              <select name="displayStatus" value={form.displayStatus} onChange={handleChange} className="input-field">
                <option value="NORMAL">📦 Normal</option>
                <option value="FEATURED">⭐ Featured</option>
                <option value="SPONSORED">🚀 Sponsored</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Retail Price (₹) *</label>
              <input name="basePrice" type="number" step="0.01" value={form.basePrice} onChange={handleChange} className="input-field" required />
            </div>
            <div className={styles.formGroup}>
              <label>Sale Price (₹) <span style={{color:'var(--color-text-muted)',fontSize:'0.8rem'}}>optional — must be less than retail</span></label>
              <input name="salePrice" type="number" step="0.01" value={form.salePrice} onChange={handleChange} className="input-field" placeholder="Leave blank for no sale" />
            </div>
            <div className={styles.formGroup}>
              <label>Wholesale Price (₹)</label>
              <input name="baseWholesalePrice" type="number" step="0.01" value={form.baseWholesalePrice} onChange={handleChange} className="input-field" />
            </div>
            <div className={styles.formGroup}>
              <label>Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="input-field" />
            </div>
            <div className={styles.formGroup}>
              <label>Color</label>
              <input name="color" value={form.color} onChange={handleChange} className="input-field" />
            </div>
            <div className={styles.formGroup}>
              <label>Size</label>
              <select name="size" value={form.size} onChange={handleChange} className="input-field">
                {['26','28','30','32','34','36','38','40','42'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Fit</label>
              <select name="fit" value={form.fit} onChange={handleChange} className="input-field">
                {['Slim','Regular','Relaxed','Skinny','Bootcut','Straight','Tapered'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option>Men</option><option>Women</option><option>Unisex</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Upload Image</label>
              <input type="file" accept="image/*" ref={fileRef} className="input-field" />
            </div>
            <div className={styles.formGroup}>
              <label>Or Image URL</label>
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows={3} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      )}

      {/* Product Table */}
      <div className={styles.tableWrap}>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>Showing {products.length} of {total} products (Page {page}/{pages})</p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Price / Sale</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={deletingIds.has(p.id) ? styles.rowDeleting : ''}>

                {/* Image + Name + Category */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Product thumbnail */}
                    <div style={{
                      width: '56px', height: '56px', flexShrink: 0,
                      borderRadius: '6px', overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-alt)',
                    }}>
                      <img
                        src={p.imageUrl || '/kamikaze_logo.png'}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.currentTarget.src = '/kamikaze_logo.png'; }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {p.category} · {p.fit} · {p.color}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Size {p.size}</div>
                    </div>
                  </div>
                </td>

                {/* Display Status Dropdown */}
                <td>
                  <select
                    value={p.displayStatus || 'NORMAL'}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    disabled={updatingIds.has(p.id)}
                    style={{
                      fontSize: '0.78rem', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--color-border)',
                      background: STATUS_CONFIG[p.displayStatus]?.color || '#6b7280',
                      color: 'white', fontWeight: 700, cursor: 'pointer', appearance: 'none',
                      minWidth: '110px',
                    }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key} style={{ background: 'white', color: '#111' }}>{cfg.emoji} {cfg.label}</option>
                    ))}
                  </select>
                </td>

                {/* Price & Sale Price */}
                <td>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>₹{p.basePrice?.toFixed(2)}</div>
                  <SalePriceEditor
                    product={p}
                    onUpdate={(salePrice) => handleSalePriceUpdate(p.id, salePrice)}
                    disabled={updatingIds.has(p.id)}
                  />
                </td>

                {/* Stock Controls */}
                <td>
                  <StockControls
                    product={p}
                    restocking={restocking}
                    restockAmounts={restockAmounts}
                    setRestockAmounts={setRestockAmounts}
                    onAdjust={handleStockAdjust}
                  />
                </td>

                {/* Delete */}
                <td>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={styles.deleteBtn}
                    disabled={deletingIds.has(p.id)}
                  >
                    {deletingIds.has(p.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="5">No products found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline">← Prev</button>
        <span>Page {page} of {pages}</span>
        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-outline">Next →</button>
      </div>
    </div>
  );
}

// ─── Sale Price Inline Editor ─────────────────────────────────────────────────
function SalePriceEditor({ product, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.salePrice || '');

  const handleSave = () => {
    onUpdate(value ? parseFloat(value) : null);
    setEditing(false);
  };

  const handleRemove = () => {
    setValue('');
    onUpdate(null);
  };

  if (!editing) {
    return (
      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {product.salePrice ? (
          <>
            <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.82rem' }}>
              🔥 ₹{product.salePrice.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: '3px', border: '1px solid #bbf7d0' }}>
              {Math.round((1 - product.salePrice / product.basePrice) * 100)}% OFF
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No sale</span>
        )}
        <button
          onClick={() => { setValue(product.salePrice || ''); setEditing(true); }}
          disabled={disabled}
          style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--color-border)', cursor: 'pointer', background: 'white', color: '#111' }}
        >
          {product.salePrice ? 'Edit' : '+ Set Sale'}
        </button>
        {product.salePrice && (
          <button
            onClick={handleRemove}
            disabled={disabled}
            style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '3px', border: '1px solid #fca5a5', cursor: 'pointer', background: '#fef2f2', color: '#dc2626' }}
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '0.8rem' }}>₹</span>
      <input
        type="number" step="0.01" min="0"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Sale price"
        autoFocus
        style={{ width: '80px', padding: '2px 4px', fontSize: '0.78rem', border: '1px solid var(--color-border)', borderRadius: '3px' }}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      />
      <button onClick={handleSave} disabled={disabled} style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#111', color: 'white', border: 'none', cursor: 'pointer' }}>✓</button>
      <button onClick={() => setEditing(false)} style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', cursor: 'pointer' }}>✕</button>
    </div>
  );
}

// ─── Stock Controls (Add + Subtract) ─────────────────────────────────────────
function StockControls({ product, restocking, restockAmounts, setRestockAmounts, onAdjust }) {
  const p = product;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: p.stock <= 5 ? (p.stock === 0 ? '#dc2626' : '#f59e0b') : 'inherit' }}>
        {p.stock} units
      </span>
      {/* Quick add buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
        {[1, 10, 50].map(amt => (
          <button key={amt}
            onClick={() => onAdjust(p.id, amt)}
            disabled={restocking === p.id}
            style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >+{amt}</button>
        ))}
        {/* Quick subtract buttons */}
        {[1, 10].map(amt => (
          <button key={`-${amt}`}
            onClick={() => onAdjust(p.id, -amt)}
            disabled={restocking === p.id || p.stock === 0}
            style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >-{amt}</button>
        ))}
      </div>
      {/* Custom quantity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <input
          type="number" min="1" placeholder="Qty"
          value={restockAmounts[p.id] || ''}
          onChange={(e) => setRestockAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
          style={{ width: '48px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '3px', textAlign: 'center' }}
        />
        <button
          onClick={() => { const amt = parseInt(restockAmounts[p.id]); if (amt > 0) { onAdjust(p.id, amt); setRestockAmounts(prev => ({ ...prev, [p.id]: '' })); }}}
          disabled={restocking === p.id || !restockAmounts[p.id]}
          style={{ padding: '2px 5px', fontSize: '0.6rem', borderRadius: '3px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >{restocking === p.id ? '...' : '+Add'}</button>
        <button
          onClick={() => { const amt = parseInt(restockAmounts[p.id]); if (amt > 0) { onAdjust(p.id, -amt); setRestockAmounts(prev => ({ ...prev, [p.id]: '' })); }}}
          disabled={restocking === p.id || !restockAmounts[p.id] || p.stock === 0}
          style={{ padding: '2px 5px', fontSize: '0.6rem', borderRadius: '3px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >{restocking === p.id ? '...' : '-Sub'}</button>
      </div>
    </div>
  );
}
