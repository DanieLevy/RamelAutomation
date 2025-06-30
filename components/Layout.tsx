import { ReactNode } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import PageLoader from '@/components/PageLoader';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const { isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      <Head>
        <title>{title || 'תורים לרם-אל'}</title>
        <meta name="description" content={description || "בדיקת תורים פנויים במספרת רם-אל"} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#FFFFFF" id="theme-color-meta" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-container mx-auto px-4 py-5 max-w-screen-sm" dir="rtl">
        <Header />
        {children}
      </div>

      <BottomNavigation />
    </div>
  );
} 