import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Analytics from '@/components/Analytics';
import PageTracker from '@/components/PageTracker';

export const metadata = {
  title: 'Kamikaze Jeans | Premium Denim & Streetwear',
  description: 'The highest quality premium denim. Retail and wholesale available.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <PageTracker />
        <Analytics />
      </body>
    </html>
  );
}
