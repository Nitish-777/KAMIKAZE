'use client';
import { useState, useEffect } from 'react';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'];

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Home', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    const res = await fetch('/api/addresses');
    if (res.ok) setAddresses(await res.json());
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/addresses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ label: 'Home', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false });
      fetchAddresses();
    }
  };

  const deleteAddress = async (id) => {
    await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' };

  const handleUseExistingAddress = (address) => {
    setForm({ 
      label: address.label, 
      name: address.name, 
      phone: address.phone, 
      address: address.address, 
      city: address.city, 
      state: address.state, 
      pincode: address.pincode, 
      isDefault: false 
    });
  };

  if (loading) return <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>📍 Saved Addresses</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
          {showForm ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {showForm && (
        <>
          {addresses.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--rounded-md)', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e40af' }}>💡 Quick Suggestions</p>
              <p style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.75rem' }}>Use one of your previously saved addresses:</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {addresses.map(a => (
                  <button 
                    key={a.id}
                    type="button"
                    onClick={() => handleUseExistingAddress(a)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      border: '1px solid #93c5fd', 
                      background: 'white',
                      color: '#1e40af',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#dbeafe'}
                    onMouseOut={(e) => e.target.style.background = 'white'}
                  >
                    {a.label}: {a.city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Label</label>
              <select value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="input-field">
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </div>
            <div><label style={labelStyle}>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
            <div><label style={labelStyle}>Phone *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" required maxLength={10} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Address *</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" required rows={2} /></div>
            <div><label style={labelStyle}>City *</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" required /></div>
            <div><label style={labelStyle}>State *</label><select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="input-field" required><option value="">Select</option>{INDIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>Pincode *</label><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="input-field" required maxLength={6} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} id="default-check" />
            <label htmlFor="default-check" style={{ fontSize: '0.9rem' }}>Set as default address</label>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '10px 24px' }}>Save Address</button>
        </form>
      )}

      {addresses.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>No saved addresses yet</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {addresses.map(a => (
            <div key={a.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.25rem', background: 'white', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>{a.label}</span>
                {a.isDefault && <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#10b981', color: 'white' }}>Default</span>}
              </div>
              <p style={{ fontWeight: 600 }}>{a.name}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>{a.address}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{a.city}, {a.state} - {a.pincode}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>📞 {a.phone}</p>
              <button onClick={() => deleteAddress(a.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
