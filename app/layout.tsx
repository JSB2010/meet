import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/globals.css';
import '../styles/meet.css';
import '../styles/meet-screens.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Meet | Join a meeting',
    template: '%s',
  },
  description: 'Join protected meeting rooms.',
  openGraph: {
    url: 'https://meet.jacobbarkin.com',
    images: [
      {
        url: 'https://meet.jacobbarkin.com/images/meeting-room-redesign.png',
        width: 1672,
        height: 941,
        type: 'image/png',
      },
    ],
    siteName: 'Meet',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/images/jacob-logo.png',
      type: 'image/png',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/jacob-logo.png',
        sizes: '180x180',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f6fa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="meet-theme-init" strategy="beforeInteractive">
          {"try{var m=localStorage.getItem('meet-theme')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme-mode',m);document.documentElement.setAttribute('data-theme',m==='system'?d:m)}catch(e){}"}
        </Script>
      </head>
      <body data-lk-theme="default">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '999px',
              background: '#ffffff',
              color: '#0c1424',
              border: '1px solid #e5e9f0',
              boxShadow:
                '0 24px 60px rgba(13,22,41,0.12), 0 8px 20px rgba(13,22,41,0.06)',
              fontSize: '13.5px',
              fontWeight: 540,
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
