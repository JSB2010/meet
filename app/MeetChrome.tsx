'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8.5 20h7M12 16.5V20" />
    </svg>
  );
}

export function BrandLogo({ href = '/' }: { href?: string }) {
  return (
    <Link className="logo" href={href} aria-label="Meet home">
      <span className="logo-mark logo-mark-image">
        <Image src="/images/jacob-logo.png" alt="" width={32} height={32} priority />
      </span>
      <span className="logo-name">Meet</span>
    </Link>
  );
}

export function ThemeToggle() {
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = () => {
      if (document.documentElement.getAttribute('data-theme-mode') === 'system') {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      }
    };
    applySystemTheme();
    mediaQuery.addEventListener('change', applySystemTheme);
    return () => mediaQuery.removeEventListener('change', applySystemTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme-mode') ?? 'system';
    const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
    const resolved =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : next;
    document.documentElement.setAttribute('data-theme-mode', next);
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('meet-theme', next);
  }, []);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title="Theme: light, dark, or system"
      aria-label="Cycle theme between light, dark, and system"
      suppressHydrationWarning
    >
      <SunIcon className="theme-icon-sun" />
      <MoonIcon className="theme-icon-moon" />
      <SystemIcon className="theme-icon-system" />
    </button>
  );
}

export function JacobCredit() {
  React.useEffect(() => {
    if (document.querySelector('script[src="https://jacobbarkin.com/embed/credit.js"]')) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://jacobbarkin.com/embed/credit.js';
    document.head.appendChild(script);
  }, []);

  return (
    <div className="jacob-credit-wrap">
      {React.createElement('jb-credit' as keyof React.JSX.IntrinsicElements)}
    </div>
  );
}
