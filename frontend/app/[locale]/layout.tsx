import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { Metadata, Viewport } from 'next';
import '../globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionManager from '@/components/SessionManager';
import PlausibleProvider from '@/components/PlausibleProvider';
import WelcomePopup from '@/components/WelcomePopup';

// Viewport configuration (separate from metadata in Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// SEO Metadata Configuration
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telegramacessovip.com';
  const logoUrl = `${siteUrl}/logo.png`;

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('siteName')}`,
    },
    description: t('description'),
    keywords: t('keywords'),
    authors: [{ name: 'Vip Acess' }],
    creator: 'Vip Acess',
    publisher: 'Vip Acess',

    // Robots and indexing
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      type: 'website',
      locale: locale,
      url: siteUrl,
      siteName: t('siteName'),
      title: t('title'),
      description: t('description'),
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: t('siteName'),
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [logoUrl],
      creator: '@vipacess',
    },

    // Verification and webmaster tools
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },

    // Alternate languages
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'pt': `${siteUrl}/pt`,
        'es': `${siteUrl}/es`,
      },
    },

    // Icons
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
  };
}

export default async function LocaleLayout({
                                             children,
                                             params,
                                           }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
      <html lang={locale}>
      <body>
      <SessionManager />
      <PlausibleProvider />
      <WelcomePopup />
      <NextIntlClientProvider messages={messages}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </NextIntlClientProvider>
      </body>
      </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


