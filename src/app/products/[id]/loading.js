import styles from './page.module.css';

export default function ProductDetailLoading() {
  return (
    <div className={`container ${styles.detailContainer}`}>
      <div className={styles.imageSection}>
        <div className={styles.imageWrapper}>
          <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      <div className={styles.infoSection}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ width: '50px', height: '24px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ width: '55px', height: '24px', borderRadius: '20px' }} />
        </div>
        <div className="skeleton" style={{ width: '80%', height: '40px', borderRadius: '4px', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ width: '120px', height: '28px', borderRadius: '4px', marginBottom: '2rem' }} />
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '90%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ width: '70%', height: '14px', borderRadius: '4px', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '50px', borderRadius: 'var(--rounded-md)' }} />
      </div>
    </div>
  );
}
