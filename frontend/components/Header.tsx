'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export default function Header() {
  const t = useTranslations('nav');

  return (
    <header className="bg-noir-dark border-b border-noir-light">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Vip Acess Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <h1 className="text-2xl font-serif font-bold text-accent-emerald pr-2">
              Vip Acess
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-accent-emerald transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              href="/store"
              className="text-gray-300 hover:text-accent-emerald transition-colors"
            >
              {t('store')}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-300 hover:text-accent-gold">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
