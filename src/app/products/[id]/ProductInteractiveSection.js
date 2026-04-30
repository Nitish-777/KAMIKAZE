'use client';
import { useState } from 'react';
import ProductActions from './ProductActions';
import CheckoutButton from './CheckoutButton';
import SizeChart from './SizeChart';

export default function ProductInteractiveSection({ product, price, isWholesale, isAdmin }) {
  const [selectedSize, setSelectedSize] = useState(product.size);
  const SIZES = ['26', '28', '30', '32', '34', '36', '38', '40', '42'];

  if (isAdmin) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select Size</label>
          <SizeChart />
        </div>
        <select 
          value={selectedSize} 
          onChange={(e) => setSelectedSize(e.target.value)} 
          className="input-field" 
          style={{ width: '100%', fontWeight: 600, fontSize: '1rem', padding: '12px' }}
        >
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <ProductActions productId={product.id} maxStock={product.stock} selectedSize={selectedSize} />
      </div>

      <div>
        <CheckoutButton productId={product.id} productName={product.name} price={price} maxStock={product.stock} isWholesale={isWholesale} selectedSize={selectedSize} />
      </div>
    </div>
  );
}
