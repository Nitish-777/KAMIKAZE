'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './AdminProducts.module.css';

export default function AdminProductsClient() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [restocking, setRestocking] = useState(null); // productId
  const [restockAmounts, setRestockAmounts] = useState({}); // { productId: amount }
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', description: '', category: 'Jeans', color: 'Blue',
    size: '32', fit: 'Regular', gender: 'Unisex', featured: false,
    basePrice: '', baseWholesalePrice: '', stock: '', imageUrl: ''
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

    // Attach image file if selected
    if (fileRef.current?.files?.[0]) {
      formData.append('image', fileRef.current.files[0]);
    }

    const res = await fetch('/api/admin/products', { method: 'POST', body: formData });

    if (res.ok) {
      showMessage('success', 'Product added successfully!');
      setForm({ name: '', description: '', category: 'Jeans', color: 'Blue', size: '32', fit: 'Regular', gender: 'Unisex', featured: false, basePrice: '', baseWholesalePrice: '', stock: '', imageUrl: '' });
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

    // Optimistic removal — save current state for rollback
    const previousProducts = [...products];
    const previousTotal = total;

    // Immediately remove from UI
    setDeletingIds(prev => new Set(prev).add(id));

    // Short delay for fade animation, then remove
    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);

    // Make the API call
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'Product deleted successfully');
        // Recalculate pages
        const newTotal = previousTotal - 1;
        const newPages = Math.ceil(newTotal / 20) || 1;
        setPages(newPages);
        if (page > newPages) setPage(newPages);
      } else {
        // Rollback on failure
        setProducts(previousProducts);
        setTotal(previousTotal);
        showMessage('error', 'Failed to delete product. Rolled back.');
      }
    } catch {
      // Rollback on network error
      setProducts(previousProducts);
      setTotal(previousTotal);
      showMessage('error', 'Network error. Product was not deleted.');
    }
  };

  const handleRestock = async (productId, amount) => {
    setRestocking(productId);
    const res = await fetch('/api/admin/restock', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, amount })
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: data.newStock } : p));
      showMessage('success', `Restocked +${amount} units`);
    } else {
      showMessage('error', 'Failed to restock');
    }
    setRestocking(null);
  };

  return (
    <div>
      {/* Toast Message */}
      {message && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Search & Actions */}
      <div className={styles.toolbar}>
        <input
          type="text"
          className="input-field"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              <label>Retail Price ($) *</label>
              <input name="basePrice" type="number" step="0.01" value={form.basePrice} onChange={handleChange} className="input-field" required />
            </div>
            <div className={styles.formGroup}>
              <label>Wholesale Price ($)</label>
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
            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '1.5rem'}}>
              <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} id="featured-check" />
              <label htmlFor="featured-check">Featured Product</label>
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
              <th>Category</th>
              <th>Fit</th>
              <th>Color</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr
                key={p.id}
                className={deletingIds.has(p.id) ? styles.rowDeleting : ''}
              >
                <td>{p.name}{p.featured && <span className="badge" style={{ marginLeft: 8 }}>Featured</span>}</td>
                <td>{p.category}</td>
                <td>{p.fit}</td>
                <td>{p.color}</td>
                <td>₹{p.basePrice?.toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: p.stock <= 5 ? 'var(--color-accent)' : p.stock === 0 ? '#dc2626' : 'inherit', minWidth: '30px' }}>{p.stock}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {[1, 10, 50].map(amt => (
                        <button key={amt}
                          onClick={() => handleRestock(p.id, amt)}
                          disabled={restocking === p.id}
                          style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        >+{amt}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <input
                        type="number" min="1" placeholder="Qty"
                        value={restockAmounts[p.id] || ''}
                        onChange={(e) => setRestockAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ width: '50px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '3px', textAlign: 'center' }}
                      />
                      <button
                        onClick={() => { const amt = parseInt(restockAmounts[p.id]); if (amt > 0) { handleRestock(p.id, amt); setRestockAmounts(prev => ({ ...prev, [p.id]: '' })); } }}
                        disabled={restocking === p.id || !restockAmounts[p.id]}
                        style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '3px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >{restocking === p.id ? '...' : 'Add'}</button>
                    </div>
                  </div>
                </td>
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
            {products.length === 0 && <tr><td colSpan="7">No products found.</td></tr>}
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
