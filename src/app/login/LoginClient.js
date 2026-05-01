'use client';

import { signIn } from 'next-auth/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

export default function LoginClient({ initialError }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'verify'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    initialError === 'OAuthAccountNotLinked' 
      ? 'An account already exists with this email. Please sign in with a password or magic link first.'
      : initialError === 'OAuthCallbackError'
      ? 'Google login was interrupted or failed. Please try again.'
      : initialError === 'RateLimitExceeded' || initialError === 'AccessDenied'
      ? 'Too many login attempts. Please try again after 10 minutes.'
      : initialError
  );
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) {
      if (otpStep === 'verify') setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, otpStep]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Send OTP ---
  const handleSendOtp = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setError(''); setSuccess(''); setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpStep('verify');
        setCountdown(OTP_EXPIRY_SECONDS);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccess('Verification code sent to ' + email.trim());
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [email]);

  // --- Resend OTP ---
  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    await handleSendOtp();
  };

  // --- OTP input handlers ---
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // --- Verify OTP ---
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the complete 6-digit code'); return; }
    setError(''); setLoading(true);

    try {
      // Step 1: Verify OTP with Supabase (via our API)
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: code }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Step 2: Exchange one-time token for NextAuth session
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        otpToken: verifyData.otpToken,
      });

      if (signInRes?.error) {
        setError('Sign in failed. Please try again.');
      } else {
        setSuccess('Verified! Redirecting...');
        router.push('/products');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.every(d => d !== '') && otpStep === 'verify') {
      handleVerifyOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // --- Password Login ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Email and password are required'); return; }
    setError(''); setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/products');
      router.refresh();
    }
  };

  // --- Register ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('All fields are required');
      return;
    }
    setError(''); setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), email: regEmail.trim(), password: regPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Automatically sign in
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signInRes?.error) {
        setError('Account created, but sign in failed. Please sign in manually.');
        setTab('signin');
        setAuthMode('password');
      } else {
        setSuccess('Account created! Redirecting...');
        router.push('/products');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // --- Styles ---
  const containerStyle = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: 'calc(100vh - 80px)', padding: '2rem 20px',
  };

  const cardStyle = {
    maxWidth: '440px', width: '100%', background: 'white',
    borderRadius: 'var(--rounded-xl)', border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
  };

  const headerStyle = {
    background: 'var(--color-primary)', padding: '24px', textAlign: 'center', color: 'white',
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '12px', textAlign: 'center', fontWeight: 700,
    fontSize: '0.9rem', cursor: 'pointer', border: 'none',
    background: active ? 'white' : 'var(--color-bg-alt)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    borderBottom: active ? '3px solid var(--color-primary)' : '3px solid transparent',
    transition: 'all 0.2s ease',
  });

  const otpInputStyle = {
    width: '48px', height: '56px', textAlign: 'center',
    fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)',
    border: '2px solid var(--color-border)', borderRadius: 'var(--rounded-md)',
    outline: 'none', transition: 'border-color 0.2s ease',
  };

  const googleButtonStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    width: '100%', padding: '12px', borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--color-border)', background: 'white',
    color: 'var(--color-text)', fontWeight: 600, fontSize: '0.95rem',
    cursor: 'pointer', transition: 'all 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Brand Header */}
        <div style={headerStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)', letterSpacing: '3px', fontSize: '1.4rem', margin: 0 }}>
            KAMIKAZE
          </h2>
          <p style={{ opacity: 0.7, fontSize: '0.8rem', marginTop: '4px' }}>Premium Denim & Streetwear</p>
        </div>

        {/* Main Tabs */}
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(tab === 'signin')} onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}>
            Sign In
          </button>
          <button style={tabStyle(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}>
            Sign Up
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Error / Success messages */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--rounded-md)', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--rounded-md)', color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span> {success}
            </div>
          )}

          {tab === 'signup' ? (
            /* Sign Up Form */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Full Name</label>
                <input type="text" className="input-field" value={regName}
                  onChange={(e) => setRegName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email</label>
                <input type="email" className="input-field" value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: '44px' }}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1,
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            /* Sign In Form */
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', background: 'var(--color-bg-alt)', padding: '4px', borderRadius: 'var(--rounded-md)' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer', background: authMode === 'password' ? 'white' : 'transparent', color: authMode === 'password' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: authMode === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('otp')}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer', background: authMode === 'otp' ? 'white' : 'transparent', color: authMode === 'otp' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: authMode === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                >
                  Magic Link
                </button>
              </div>

              {authMode === 'otp' ? (
                <>
                  {otpStep === 'email' ? (
                    <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email Address</label>
                        <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoFocus style={{ fontSize: '1rem' }} />
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>We&apos;ll send a 6-digit verification code to your email</p>
                      <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                        {loading ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>Code sent to</p>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 4px' }}>{email}</p>
                        <button type="button" onClick={() => { setOtpStep('email'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Change email</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
                        {otp.map((digit, i) => (
                          <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} onPaste={i === 0 ? handleOtpPaste : undefined} style={{ ...otpInputStyle, borderColor: digit ? 'var(--color-primary)' : 'var(--color-border)', boxShadow: digit ? '0 0 0 1px var(--color-primary)' : 'none' }} autoFocus={i === 0} />
                        ))}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        {countdown > 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Code expires in <strong style={{ color: countdown < 60 ? 'var(--color-accent)' : 'var(--color-primary)' }}>{formatTime(countdown)}</strong></p>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>Code expired</p>
                        )}
                        {canResend && (
                          <button type="button" onClick={handleResendOtp} disabled={loading} style={{ background: 'none', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '8px 20px', borderRadius: 'var(--rounded-md)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px', transition: 'all 0.2s ease' }}>{loading ? 'Sending...' : '🔄 Resend Code'}</button>
                        )}
                      </div>
                      <button type="submit" className="btn-primary" disabled={loading || otp.join('').length !== 6} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email</label>
                    <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingRight: '44px' }} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1 }}>{showPassword ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ padding: '0 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/products' })}
            style={googleButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
