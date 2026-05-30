import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Jacob Meet | Join a meeting',
    template: '%s',
  },
  description: 'Join protected meeting rooms hosted by Jacob Barkin.',
  openGraph: {
    url: 'https://meet.jacobbarkin.com',
    images: [
      {
        url: 'https://meet.jacobbarkin.com/images/meeting-room-render.png',
        width: 1792,
        height: 1024,
        type: 'image/png',
      },
    ],
    siteName: 'Jacob Meet',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
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
  themeColor: '#f8fbff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
