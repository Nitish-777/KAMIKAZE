import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export const metadata = { title: 'Sign In | Kamikaze Jeans' };

export default async function LoginPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  
  // If the user is already logged in, instantly redirect them to the shop
  if (session) {
    redirect('/products');
  }

  // Parse searchParams to capture any OAuth errors that NextAuth might have passed back
  const sp = await searchParams;
  const error = sp?.error || '';

  return <LoginClient initialError={error} />;
}
