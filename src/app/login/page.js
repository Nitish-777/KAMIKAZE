'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/products');
      router.refresh();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created! Signing you in...');
        // Auto-login after register
        const loginRes = await signIn('credentials', { redirect: false, email, password });
        if (loginRes?.ok) {
          router.push('/products');
          router.refresh();
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const autofill = (type) => {
    setEmail(type === 'admin' ? 'admin@kamikaze.com' : type === 'retail' ? 'retail@kamikaze.com' : 'wholesale@kamikaze.com');
    setPassword('password123');
    setIsLogin(true);
  };

  const containerStyle = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: 'calc(100vh - 80px)', padding: '2rem 20px'
  };

  const cardStyle = {
    maxWidth: '440px', width: '100%', background: 'white',
    borderRadius: 'var(--rounded-xl)', border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '14px', textAlign: 'center', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer', border: 'none',
    background: active ? 'white' : 'var(--color-bg-alt)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    borderBottom: active ? '3px solid var(--color-primary)' : '3px solid transparent',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Tab Toggle */}
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(isLogin)} onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
            Sign In
          </button>
          <button style={tabStyle(!isLogin)} onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
            Create Account
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--rounded-md)', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--rounded-md)', color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem' }}>
              {success}
            </div>
          )}

          {isLogin ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Full Name</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Rahul Sharma" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', margin: '1.5rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Test Accounts */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <p className="text-muted" style={{ marginBottom: '0.75rem', fontSize: '0.75rem' }}>Demo Accounts (password: password123)</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => autofill('admin')} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', background: 'var(--color-primary)', color: 'white', border: 'none' }}>Admin</button>
              <button onClick={() => autofill('retail')} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none' }}>Retail</button>
              <button onClick={() => autofill('wholesale')} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', background: '#7c3aed', color: 'white', border: 'none' }}>Wholesale</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
