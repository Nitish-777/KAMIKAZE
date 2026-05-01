import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import CheckoutButton from './CheckoutButton';
import ProductActions from './ProductActions';
import ProductInteractiveSection from './ProductInteractiveSection';
import ReviewSection from './ReviewSection';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: `${product?.name || 'Product'} | Kamikaze` };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isWholesale = session?.user?.role === 'WHOLESALE_APPROVED';
  const isAdmin = session?.user?.role === 'ADMIN';

  const [product, reviewAgg] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { tierDiscounts: true } }),
    prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true }, _count: true }),
  ]);

  if (!product) return <div className="container mt-4">Product Not Found</div>;

  const baseDisplayPrice = isWholesale ? product.baseWholesalePrice : product.basePrice;
  const effectiveSalePrice = product.salePrice && !isWholesale ? product.salePrice : null;
  const price = effectiveSalePrice ?? baseDisplayPrice;
  const avgRating = reviewAgg._avg.rating || 0;
  const reviewCount = reviewAgg._count || 0;

  return (
    <div className={`container ${styles.detailContainer}`}>
      <div className={styles.imageSection}>
        <div className={styles.imageWrapper}>
          <Image src={product.imageUrl || '/kamikaze_logo.png'} alt={product.name} fill className={styles.productImage} />
        </div>
      </div>

      <div className={styles.infoSection}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'var(--color-primary)' }}>{product.fit}</span>
          <span className="badge" style={{ background: 'var(--color-text-muted)' }}>{product.gender}</span>
          <span className="badge" style={{ background: 'var(--color-text-muted)' }}>{product.category}</span>
          {product.displayStatus === 'FEATURED' && (
            <span className="badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>⭐ Featured</span>
          )}
          {product.displayStatus === 'SPONSORED' && (
            <span className="badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>🚀 Sponsored</span>
          )}
          {effectiveSalePrice && (
            <span className="badge" style={{ background: '#dc2626' }}>🔥 On Sale</span>
          )}
        </div>

        <h1 className={styles.title}>{product.name}</h1>

        {/* Rating Summary */}
        {reviewCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
            <span style={{ display: 'inline-flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ color: i <= Math.round(avgRating) ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>★</span>
              ))}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{avgRating.toFixed(1)}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({reviewCount})</span>
          </div>
        )}

        {/* Price — shows strikethrough + sale price if on sale */}
        <div className={styles.price}>
          {effectiveSalePrice ? (
            <>
              <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '1rem', marginRight: '10px' }}>
                ₹{baseDisplayPrice.toFixed(2)}
              </span>
              <span style={{ color: '#dc2626', fontWeight: 800 }}>₹{effectiveSalePrice.toFixed(2)}</span>
              <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                ({Math.round((1 - effectiveSalePrice / product.basePrice) * 100)}% OFF)
              </span>
            </>
          ) : (
            <>₹{price.toFixed(2)}</>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <span>Color: <strong>{product.color}</strong></span>
          <span>Size: <strong>{product.size}</strong></span>
        </div>

        {isWholesale && product.tierDiscounts.length > 0 && (
          <div className={styles.tierDiscounts}>
            <h4>Wholesale Tier Pricing:</h4>
            <ul>{product.tierDiscounts.map(tier => (<li key={tier.id}>Buy {tier.minQuantity}+: {tier.discountPct}% off</li>))}</ul>
          </div>
        )}

        <div className={styles.stock}>
          {product.stock > 0 ? (
            <span className={styles.inStock}>In Stock ({product.stock} available)</span>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>

        <p className={styles.description}>{product.description}</p>

        <ProductInteractiveSection 
          product={product} 
          price={price} 
          isWholesale={isWholesale} 
          isAdmin={isAdmin} 
        />
      </div>

      {/* Reviews Section - Full Width Below */}
      <div style={{ gridColumn: '1 / -1' }}>
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}
