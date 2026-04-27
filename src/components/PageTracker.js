'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('km_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('km_sid', sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef('');

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;

    const sid = getSessionId();
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'page_view', page: pathname, sessionId: sid })
    }).catch(() => {});
  }, [pathname]);

  return null;
}

// Helper to track events from other components
export function trackEvent(event, productId, metadata) {
  const sid = getSessionId();
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, productId, sessionId: sid, metadata })
  }).catch(() => {});
}
