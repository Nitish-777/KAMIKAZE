import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Analytics from '@/components/Analytics';
import PageTracker from '@/components/PageTracker';

export const metadata = {
  title: 'Kamikaze Jeans | Premium Denim & Streetwear',
  description: 'The highest quality premium denim. Retail and wholesale available.',
  metadataBase: new URL('http://localhost:3000'),
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
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: MuteReactDevTools }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Outfit:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <PageTracker />
        <Analytics />
      </body>
    </html>
  );
}
