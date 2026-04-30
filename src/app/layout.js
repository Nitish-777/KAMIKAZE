import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Analytics from '@/components/Analytics';
import PageTracker from '@/components/PageTracker';

export const metadata = {
  title: 'Kamikaze Jeans | Premium Denim & Streetwear',
  description: 'The highest quality premium denim. Retail and wholesale available.',
};

const MuteReactDevTools = `
  if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('We are cleaning up async info that was not on the parent Suspense boundary')) {
        return;
      }
      originalError.apply(console, args);
    };
  }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MuteReactDevTools }} />
      </head>
      <body suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <PageTracker />
        <Analytics />
      </body>
    </html>
  );
}
