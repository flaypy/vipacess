'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations('admin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    // In a real app, you'd verify the token and check if user is admin
    // For now, we'll just check if token exists
    setIsAuthenticated(true);
    setLoading(false);
  }, [router]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-gold"></div>
      </div>
    );
  }



  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-noir-darker">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-accent-gold mb-4">
            {t('title')}
          </h1>

          {/* Navigation */}
          <nav className="flex gap-4 border-b border-noir-light pb-4">
            <Link
              href="/admin/products"
              className="px-4 py-2 text-gray-300 hover:text-accent-gold transition-colors"
            >
              {t('products')}
            </Link>
            <Link
              href="/admin/orders"
              className="px-4 py-2 text-gray-300 hover:text-accent-gold transition-colors"
            >
              {t('orders')}
            </Link>
            <Link
              href="/admin/settings"
              className="px-4 py-2 text-gray-300 hover:text-accent-gold transition-colors"
            >
              {t('settings')}
            </Link>
          </nav>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
