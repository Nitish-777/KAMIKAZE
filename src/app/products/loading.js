import styles from './page.module.css';

export default function ProductsLoading() {
  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.header}>
        <div className="skeleton" style={{ width: '300px', height: '36px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '4px', marginLeft: 'auto' }} />
      </div>

      <div className={styles.filters} style={{ opacity: 0.6 }}>
        {[200, 140, 160, 130, 150].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}px`, height: '42px', borderRadius: 'var(--rounded-md)' }} />
        ))}
      </div>

      <div className="grid-products">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.productCard} style={{ overflow: 'hidden' }}>
            <div className="skeleton" style={{ width: '100%', paddingTop: '133%' }} />
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '85%', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '40%', height: '20px', borderRadius: '4px', marginTop: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
