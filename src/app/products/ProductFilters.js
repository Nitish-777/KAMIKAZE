'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const SIZES = ['26','28','30','32','34','36','38','40','42'];

export default function ProductFilters({ fits, colors, genders, currentFit, currentColor, currentGender, currentSearch, currentSort, currentSize, currentMinPrice, currentMaxPrice }) {
  const router = useRouter();

  const apply = (key, val) => {
    const params = new URLSearchParams({
      fit: currentFit, color: currentColor, gender: currentGender,
      search: currentSearch, sort: currentSort, size: currentSize || '',
      minPrice: currentMinPrice || '', maxPrice: currentMaxPrice || '', page: '1'
    });
    params.set(key, val);
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => router.push('/products');

  const hasFilters = currentFit || currentColor || currentGender || currentSearch || currentSort || currentSize || currentMinPrice || currentMaxPrice;

  return (
    <div className={styles.filters} suppressHydrationWarning>
      <input suppressHydrationWarning
        type="text" placeholder="Search jeans..." defaultValue={currentSearch}
        className="input-field" style={{ maxWidth: 180 }}
        onKeyDown={(e) => { if (e.key === 'Enter') apply('search', e.target.value); }}
      />

      <select suppressHydrationWarning value={currentSize || ''} onChange={(e) => apply('size', e.target.value)} className="input-field" style={{ maxWidth: 100 }}>
        <option value="">All Sizes</option>
        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select suppressHydrationWarning value={currentFit} onChange={(e) => apply('fit', e.target.value)} className="input-field" style={{ maxWidth: 120 }}>
        <option value="">All Fits</option>
        {fits.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      <select suppressHydrationWarning value={currentColor} onChange={(e) => apply('color', e.target.value)} className="input-field" style={{ maxWidth: 140 }}>
        <option value="">All Colors</option>
        {colors.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select suppressHydrationWarning value={currentGender} onChange={(e) => apply('gender', e.target.value)} className="input-field" style={{ maxWidth: 120 }}>
        <option value="">Gender</option>
        {genders.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      <input suppressHydrationWarning type="number" placeholder="Min ₹" defaultValue={currentMinPrice}
        className="input-field" style={{ maxWidth: 90 }}
        onBlur={(e) => apply('minPrice', e.target.value)} />

      <input suppressHydrationWarning type="number" placeholder="Max ₹" defaultValue={currentMaxPrice}
        className="input-field" style={{ maxWidth: 90 }}
        onBlur={(e) => apply('maxPrice', e.target.value)} />

      <select suppressHydrationWarning value={currentSort} onChange={(e) => apply('sort', e.target.value)} className="input-field" style={{ maxWidth: 140 }}>
        <option value="">Sort By</option>
        <option value="price_low">Price: Low → High</option>
        <option value="price_high">Price: High → Low</option>
        <option value="newest">Newest First</option>
      </select>

      {hasFilters && (
        <button onClick={clearAll} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>Clear</button>
      )}
    </div>
  );
}
