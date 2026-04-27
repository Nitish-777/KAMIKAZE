'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

export default function CheckoutButton({ productId, productName, price, maxStock, isWholesale }) {
  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState(isWholesale ? 50 : 1);
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH_ON_DELIVERY');
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const [details, setDetails] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    shippingAddress: '', shippingCity: '', shippingState: '', shippingPincode: '',
  });

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateDetails = () => {
    const newErrors = {};
    if (!details.customerName.trim()) newErrors.customerName = 'Full name is required';
    if (!details.customerPhone.trim()) {
      newErrors.customerPhone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(details.customerPhone.trim())) {
      newErrors.customerPhone = 'Enter a valid 10-digit mobile number';
    }
    if (details.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.customerEmail)) {
      newErrors.customerEmail = 'Enter a valid email address';
    }
    if (!details.shippingAddress.trim()) newErrors.shippingAddress = 'Address is required';
    if (!details.shippingCity.trim()) newErrors.shippingCity = 'City is required';
    if (!details.shippingState) newErrors.shippingState = 'State is required';
    if (!details.shippingPincode.trim()) {
      newErrors.shippingPincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(details.shippingPincode.trim())) {
      newErrors.shippingPincode = 'Enter a valid 6-digit pincode';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToDetails = () => {
    if (quantity > maxStock) return alert('Not enough stock');
    if (isWholesale && quantity < 50) return alert('Wholesale minimum is 50');
    setStep(2);
  };

  const goToReview = () => { if (validateDetails()) setStep(3); };

  const handleOrder = async (paymentId = null) => {
    setLoading(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId, quantity: parseInt(quantity) }],
        paymentMode, ...details,
        paymentId
      })
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      alert(`Order Placed Successfully! Order ID: ${data.orderId?.slice(0, 8)}`);
      router.push('/');
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to place order. Did you sign in?');
      if (data.error === 'Unauthorized') router.push('/login');
    }
  };

  const processPaymentAndOrder = async () => {
    if (paymentMode === 'ONLINE') {
      setLoading(true);
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
        setLoading(false);
        return alert('Failed to load payment gateway');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_dummykey12345',
        amount: Math.round(totalPrice * 100), // amount in paise
        currency: 'INR',
        name: 'Kamikaze Jeans',
        description: 'Order Payment',
        handler: async function (response) {
          await handleOrder(response.razorpay_payment_id);
        },
        prefill: {
          name: details.customerName,
          email: details.customerEmail,
          contact: details.customerPhone
        },
        theme: { color: '#111111' },
        modal: { ondismiss: () => setLoading(false) }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment Failed: ' + response.error.description);
          setLoading(false);
        });
        rzp.open();
      } catch (err) {
        alert("Payment initialization failed. Please check your Razorpay key.");
        console.error(err);
        setLoading(false);
      }
    } else {
      await handleOrder();
    }
  };

  const totalPrice = (price * parseInt(quantity || 0)).toFixed(2);

  if (step === 0) {
    return (
      <button onClick={() => setStep(1)} disabled={maxStock === 0} className="btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
        {maxStock === 0 ? 'Out of Stock' : '🛒 Buy Now'}
      </button>
    );
  }

  const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' };
  const errorStyle = { fontSize: '0.8rem', color: '#ef4444', fontWeight: 500 };
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
  const summaryBoxStyle = { padding: '14px 16px', background: 'var(--color-bg-alt)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-border)' };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--rounded-md)', padding: '1.5rem', background: 'white' }}>
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1.5rem', flexWrap: 'wrap', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        {['Quantity', 'Delivery Details', 'Review & Pay'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
              background: step >= i + 1 ? 'var(--color-primary)' : 'var(--color-border)', color: step >= i + 1 ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.3s ease' }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{label}</span>
            {i < 2 && <div style={{ width: 20, height: 2, background: step > i + 1 ? 'var(--color-primary)' : 'var(--color-border)', margin: '0 4px' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Quantity */}
      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <h4 style={{ marginBottom: '1rem' }}>Select Quantity</h4>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={() => setQuantity(q => Math.max(isWholesale ? 50 : 1, parseInt(q) - 1))} className="btn-outline" style={{ padding: '8px 14px', fontWeight: 700 }}>−</button>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={isWholesale ? 50 : 1} max={maxStock} className="input-field" style={{ width: '80px', textAlign: 'center', fontWeight: 700 }} />
            <button onClick={() => setQuantity(q => Math.min(maxStock, parseInt(q) + 1))} className="btn-outline" style={{ padding: '8px 14px', fontWeight: 700 }}>+</button>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--color-bg-alt)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>₹{price.toFixed(2)} × {quantity}</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{totalPrice}</span>
            </div>
          </div>
          {isWholesale && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>* MOQ: 50 items for wholesale</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button onClick={() => setStep(0)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
            <button onClick={goToDetails} className="btn-primary" style={{ flex: 2 }}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 2: Delivery Details */}
      {step === 2 && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <h4 style={{ marginBottom: '1rem' }}>📦 Delivery Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input name="customerName" value={details.customerName} onChange={handleDetailChange} className="input-field" placeholder="e.g. Rahul Sharma" />
              {errors.customerName && <span style={errorStyle}>{errors.customerName}</span>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Mobile Number *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{ padding: '12px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRight: 'none', borderRadius: 'var(--rounded-md) 0 0 var(--rounded-md)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>+91</span>
                <input name="customerPhone" value={details.customerPhone} onChange={handleDetailChange} className="input-field" placeholder="9876543210" style={{ borderRadius: '0 var(--rounded-md) var(--rounded-md) 0' }} maxLength={10} />
              </div>
              {errors.customerPhone && <span style={errorStyle}>{errors.customerPhone}</span>}
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Email (optional)</label>
              <input name="customerEmail" value={details.customerEmail} onChange={handleDetailChange} className="input-field" placeholder="email@example.com" type="email" />
              {errors.customerEmail && <span style={errorStyle}>{errors.customerEmail}</span>}
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>House/Flat No., Building, Street *</label>
              <textarea name="shippingAddress" value={details.shippingAddress} onChange={handleDetailChange} className="input-field" rows={2} placeholder="e.g. Flat 402, Tower B, Green Valley Apartments, MG Road" />
              {errors.shippingAddress && <span style={errorStyle}>{errors.shippingAddress}</span>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>City *</label>
              <input name="shippingCity" value={details.shippingCity} onChange={handleDetailChange} className="input-field" placeholder="e.g. Mumbai" />
              {errors.shippingCity && <span style={errorStyle}>{errors.shippingCity}</span>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>State *</label>
              <select name="shippingState" value={details.shippingState} onChange={handleDetailChange} className="input-field">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.shippingState && <span style={errorStyle}>{errors.shippingState}</span>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Pincode *</label>
              <input name="shippingPincode" value={details.shippingPincode} onChange={handleDetailChange} className="input-field" placeholder="400001" maxLength={6} />
              {errors.shippingPincode && <span style={errorStyle}>{errors.shippingPincode}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(1)} className="btn-outline" style={{ flex: 1 }}>← Back</button>
            <button onClick={goToReview} className="btn-primary" style={{ flex: 2 }}>Continue to Review →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Pay */}
      {step === 3 && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <h4 style={{ marginBottom: '1rem' }}>📋 Order Summary</h4>
          <div style={summaryBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>{productName || 'Product'}</span>
              <span>× {quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              <span>Total</span><span>₹{totalPrice}</span>
            </div>
          </div>
          <div style={{ ...summaryBoxStyle, marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivering to</p>
            <p style={{ fontWeight: 600 }}>{details.customerName}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{details.shippingAddress}, {details.shippingCity}, {details.shippingState} - {details.shippingPincode}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>📞 +91 {details.customerPhone}</p>
            {details.customerEmail && <p style={{ fontSize: '0.9rem' }}>✉ {details.customerEmail}</p>}
            <button onClick={() => setStep(2)} style={{ marginTop: '8px', background: 'none', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0, border: 'none' }}>Change</button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>Payment Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'CASH_ON_DELIVERY', label: '💵 Cash On Delivery', desc: 'Pay when you receive' },
                { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer', desc: 'Direct bank payment' },
                { value: 'ONLINE', label: '💳 Online Payment', desc: 'UPI / Card / Net Banking' },
              ].map(pm => (
                <label key={pm.value} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  border: `2px solid ${paymentMode === pm.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--rounded-md)', cursor: 'pointer',
                  background: paymentMode === pm.value ? 'var(--color-bg-alt)' : 'transparent', transition: 'all 0.15s ease'
                }}>
                  <input type="radio" name="paymentMode" value={pm.value} checked={paymentMode === pm.value}
                    onChange={(e) => setPaymentMode(e.target.value)} style={{ accentColor: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pm.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{pm.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(2)} className="btn-outline" style={{ flex: 1 }}>← Back</button>
            <button onClick={processPaymentAndOrder} disabled={loading} className="btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1rem' }}>
              {loading ? 'Placing Order...' : `Place Order · ₹${totalPrice}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
