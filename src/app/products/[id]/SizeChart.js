'use client';
import { useState } from 'react';

export default function SizeChart() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      <button 
        type="button" 
        onClick={toggle} 
        style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        View Size Chart
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={toggle}>
          <div style={{
            background: 'white', padding: '24px', borderRadius: '8px', 
            maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Jeans Size Chart</h3>
              <button onClick={toggle} style={{ fontSize: '24px', lineHeight: 1, cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f4f4f5' }}>
                  <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Size (Waist)</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Waist (inches)</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Hip (inches)</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Inseam (inches)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: '26', w: '27 - 28', h: '33 - 34', l: '30 - 32' },
                  { s: '28', w: '29 - 30', h: '35 - 36', l: '30 - 32' },
                  { s: '30', w: '31 - 32', h: '37 - 38', l: '30 - 32' },
                  { s: '32', w: '33 - 34', h: '39 - 40', l: '32 - 34' },
                  { s: '34', w: '35 - 36', h: '41 - 42', l: '32 - 34' },
                  { s: '36', w: '37 - 38', h: '43 - 44', l: '32 - 34' },
                  { s: '38', w: '39 - 40', h: '45 - 46', l: '32 - 34' },
                  { s: '40', w: '41 - 42', h: '47 - 48', l: '32 - 34' },
                  { s: '42', w: '43 - 44', h: '49 - 50', l: '32 - 34' },
                ].map(r => (
                  <tr key={r.s}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 600 }}>{r.s}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{r.w}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{r.h}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{r.l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '16px' }}>
              Note: Sizes may vary slightly depending on the fit (Slim, Regular, Relaxed). The inseam length depends on the specific style.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
