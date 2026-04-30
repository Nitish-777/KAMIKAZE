'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'];

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('cart'); // cart, checkout
  const [placing, setPlacing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH_ON_DELIVERY');
  const [errors, setErrors] = useState({});
  const [details, setDetails] = useState({ customerName: '', customerPhone: '', customerEmail: '', shippingAddress: '', shippingCity: '', shippingState: '', shippingPincode: '' });
  const router = useRouter();

  const fetchCart = async () => {
    const res = await fetch('/api/cart');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (cartItemId, quantity) => {
    await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartItemId, quantity }) });
    setItems(items.map(i => i.id === cartItemId ? { ...i, quantity } : i));
  };

  const updateSize = async (cartItemId, size) => {
    await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartItemId, size }) });
    setItems(items.map(i => i.id === cartItemId ? { ...i, size } : i));
  };

  const removeItem = async (cartItemId) => {
    await fetch(`/api/cart?id=${cartItemId}`, { method: 'DELETE' });
    setItems(items.filter(i => i.id !== cartItemId));
  };

  const subtotal = items.reduce((sum, i) => sum + i.product.basePrice * i.quantity, 0);

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateDetails = () => {
    const e = {};
    if (!details.customerName.trim()) e.customerName = 'Required';
    if (!/^[6-9]\d{9}$/.test(details.customerPhone.trim())) e.customerPhone = 'Valid 10-digit number required';
    if (!details.shippingAddress.trim()) e.shippingAddress = 'Required';
    if (!details.shippingCity.trim()) e.shippingCity = 'Required';
    if (!details.shippingState) e.shippingState = 'Required';
    if (!/^\d{6}$/.test(details.shippingPincode.trim())) e.shippingPincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async (paymentId = null) => {
    if (!validateDetails()) return;
    setPlacing(true);
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, size: i.size })),
        paymentMode, ...details, fromCart: true, paymentId
      })
    });
    setPlacing(false);
    if (res.ok) {
      const data = await res.json();
      alert(`Order placed! ID: ${data.orderId?.slice(0, 8)}`);
      router.push('/orders');
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to place order');
    }
  };

  const processPaymentAndOrder = async () => {
    if (!validateDetails()) return;
    
    if (paymentMode === 'CARD' || paymentMode === 'UPI' || paymentMode === 'ONLINE') {
      setPlacing(true);
      const loadRazorpay = () => new Promise(resolve => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
      
      const loaded = await loadRazorpay();
      if (!loaded) {
        setPlacing(false);
        return alert('Failed to load payment gateway');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_dummykey12345',
        amount: Math.round(subtotal * 100), // amount in paise
        currency: 'INR',
        name: 'Kamikaze Jeans',
        description: 'Order Payment',
        handler: async function (response) {
          await placeOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: details.customerName,
          email: details.customerEmail,
          contact: details.customerPhone
        },
        theme: { color: '#111111' },
        modal: { ondismiss: () => setPlacing(false) }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment Failed: ' + response.error.description);
          setPlacing(false);
        });
        rzp.open();
      } catch (err) {
        alert("Payment initialization failed. Please check your Razorpay key.");
        console.error(err);
        setPlacing(false);
      }
    } else {
      await placeOrder();
    }
  };

  const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' };
  const errorStyle = { fontSize: '0.8rem', color: '#ef4444', marginTop: '2px' };

  if (loading) return <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>Loading cart...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1>🛒 {step === 'cart' ? 'Shopping Cart' : 'Checkout'}</h1>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Your cart is empty</p>
          <Link href="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      ) : step === 'cart' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginTop: '1.5rem' }}>
          <div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                <Link href={`/products/${item.product.id}`} style={{ width: 90, height: 120, position: 'relative', borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={item.product.imageUrl || '/kamikaze_logo.png'} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="90px" />
                </Link>
                <div style={{ flex: 1 }}>
                  <Link href={`/products/${item.product.id}`} style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.product.name}</Link>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.product.fit} · {item.product.color} · 
                    <span>Size:</span>
                    <select value={item.size} onChange={(e) => updateSize(item.id, e.target.value)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.8rem', outline: 'none' }}>
                      {['26', '28', '30', '32', '34', '36', '38', '40', '42'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <p style={{ fontWeight: 700, marginTop: '6px' }}>₹{item.product.basePrice.toFixed(2)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, Math.min(item.product.stock, item.quantity + 1))} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>+</button>
                    <button onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
            <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#16a34a' }}>
                <span>Delivery</span><span>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '12px' }}>
                <span>Total</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('checkout')} className="btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '14px' }}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Checkout Form */
        <div style={{ maxWidth: '600px', marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Full Name *</label><input name="customerName" value={details.customerName} onChange={handleDetailChange} className="input-field" />{errors.customerName && <p style={errorStyle}>{errors.customerName}</p>}</div>
            <div><label style={labelStyle}>Phone *</label><input name="customerPhone" value={details.customerPhone} onChange={handleDetailChange} className="input-field" maxLength={10} />{errors.customerPhone && <p style={errorStyle}>{errors.customerPhone}</p>}</div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Email</label><input name="customerEmail" value={details.customerEmail} onChange={handleDetailChange} className="input-field" type="email" /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Address *</label><textarea name="shippingAddress" value={details.shippingAddress} onChange={handleDetailChange} className="input-field" rows={2} />{errors.shippingAddress && <p style={errorStyle}>{errors.shippingAddress}</p>}</div>
            <div><label style={labelStyle}>City *</label><input name="shippingCity" value={details.shippingCity} onChange={handleDetailChange} className="input-field" />{errors.shippingCity && <p style={errorStyle}>{errors.shippingCity}</p>}</div>
            <div><label style={labelStyle}>State *</label><select name="shippingState" value={details.shippingState} onChange={handleDetailChange} className="input-field"><option value="">Select</option>{INDIAN_STATES.map(s => <option key={s}>{s}</option>)}</select>{errors.shippingState && <p style={errorStyle}>{errors.shippingState}</p>}</div>
            <div><label style={labelStyle}>Pincode *</label><input name="shippingPincode" value={details.shippingPincode} onChange={handleDetailChange} className="input-field" maxLength={6} />{errors.shippingPincode && <p style={errorStyle}>{errors.shippingPincode}</p>}</div>
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Payment</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { v: 'CARD', l: '💳 Credit / Debit / ATM Card', desc: 'Add and secure cards as per RBI guidelines' }, 
              { v: 'UPI', l: '📱 UPI', desc: 'Pay using any UPI app' }, 
              { v: 'CASH_ON_DELIVERY', l: '💵 Cash On Delivery', desc: 'Pay when you receive' }
            ].map(p => (
              <label key={p.v} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: `2px solid ${paymentMode === p.v ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--rounded-md)', cursor: 'pointer', background: paymentMode === p.v ? 'var(--color-bg-alt)' : 'transparent' }}>
                <input type="radio" name="pm" value={p.v} checked={paymentMode === p.v} onChange={() => setPaymentMode(p.v)} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.l}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem', margin: '1.5rem 0' }}>
            <span>Total</span><span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep('cart')} className="btn-outline" style={{ flex: 1 }}>← Back</button>
            <button onClick={processPaymentAndOrder} disabled={placing} className="btn-primary" style={{ flex: 2, padding: '14px' }}>
              {placing ? 'Placing...' : `Place Order · ₹${subtotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
