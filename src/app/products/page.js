import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import ProductFilters from './ProductFilters';

export const metadata = { title: 'Collection | Kamikaze Jeans' };

export default async function ProductsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const isWholesale = session?.user?.role === 'WHOLESALE_APPROVED';
  const sp = await searchParams;

  const page = parseInt(sp?.page || '1');
  const limit = 12;
  const fit = sp?.fit || '';
  const color = sp?.color || '';
  const gender = sp?.gender || '';
  const search = sp?.search || '';
  const sort = sp?.sort || '';
  const size = sp?.size || '';
  const minPrice = sp?.minPrice || '';
  const maxPrice = sp?.maxPrice || '';

  const where = {};
  if (fit) where.fit = fit;
  if (color) where.color = color;
  if (gender) where.gender = gender;
  if (size) where.size = size;
  if (search) where.name = { contains: search };
  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice.gte = parseFloat(minPrice);
    if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
  }

  let orderBy = { name: 'asc' };
  if (sort === 'price_low') orderBy = { basePrice: 'asc' };
  if (sort === 'price_high') orderBy = { basePrice: 'desc' };
  if (sort === 'newest') orderBy = { id: 'desc' };

  const [products, total, distinctFitsRaw, distinctColorsRaw, distinctGendersRaw] = await Promise.all([
    prisma.product.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy,
      select: {
        id: true, name: true, imageUrl: true, basePrice: true,
        baseWholesalePrice: true, fit: true, color: true, stock: true, featured: true, size: true,
        reviews: { select: { rating: true } }
      }
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({ select: { fit: true }, distinct: ['fit'] }),
    prisma.product.findMany({ select: { color: true }, distinct: ['color'] }),
    prisma.product.findMany({ select: { gender: true }, distinct: ['gender'] }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const distinctFits = distinctFitsRaw.map(p => p.fit);
  const distinctColors = distinctColorsRaw.map(p => p.color);
  const distinctGenders = distinctGendersRaw.map(p => p.gender);

  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.header}>
        <h1>The Kamikaze Collection</h1>
        {isWholesale && <span className="badge">Wholesale Catalog</span>}
        <span className="text-muted" style={{ marginLeft: 'auto' }}>{total} products</span>
      </div>

      <ProductFilters
        fits={distinctFits} colors={distinctColors} genders={distinctGenders}
        currentFit={fit} currentColor={color} currentGender={gender}
        currentSearch={search} currentSort={sort} currentSize={size}
        currentMinPrice={minPrice} currentMaxPrice={maxPrice}
      />

      <div className="grid-products">
        {products.map(product => {
          const avgRating = product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
            : 0;

          return (
            <Link href={`/products/${product.id}`} key={product.id} className={`${styles.productCard} hover-lift`}>
              <div className={styles.imageWrapper}>
                <Image src={product.imageUrl || '/kamikaze_logo.png'} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className={styles.productImage} loading="lazy" />
                {product.stock === 0 && <div className={styles.soldOut}>Sold Out</div>}
                {product.featured && <div className={styles.featuredTag}>Featured</div>}
                {product.stock > 0 && product.stock <= 5 && <div className={styles.lowStock}>Only {product.stock} left!</div>}
              </div>
              <div className={styles.productInfo}>
                <p className={styles.productMeta}>{product.fit} Fit · {product.color} · Size {product.size}</p>
                <h3 className={styles.productName}>{product.name}</h3>
                {avgRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', gap: '1px' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ color: i <= Math.round(avgRating) ? '#f59e0b' : '#d1d5db', fontSize: '12px' }}>★</span>
                      ))}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({product.reviews.length})</span>
                  </div>
                )}
                <p className={styles.productPrice}>
                  ₹{isWholesale ? product.baseWholesalePrice.toFixed(2) : product.basePrice.toFixed(2)}
                  {isWholesale && <span className={styles.retailCompare}>(Retail: ₹{product.basePrice.toFixed(2)})</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 && <Link href={`/products?page=${page - 1}&fit=${fit}&color=${color}&gender=${gender}&search=${search}&sort=${sort}&size=${size}&minPrice=${minPrice}&maxPrice=${maxPrice}`} className="btn-outline">← Previous</Link>}
          <span className="text-muted">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/products?page=${page + 1}&fit=${fit}&color=${color}&gender=${gender}&search=${search}&sort=${sort}&size=${size}&minPrice=${minPrice}&maxPrice=${maxPrice}`} className="btn-outline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
