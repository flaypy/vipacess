import React from 'react';

interface ProductStructuredDataProps {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    prices?: Array<{
      amount: number;
      currency: string;
    }>;
  };
  locale: string;
}

/**
 * Structured Data (JSON-LD) component for Product pages
 * Helps search engines understand product information
 */
export function ProductStructuredData({ product, locale }: ProductStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telegramvipacess.com';

  // Find the lowest price for the product
  const lowestPrice = product.prices && product.prices.length > 0
    ? Math.min(...product.prices.map(p => p.amount))
    : 0;

  const currency = product.prices && product.prices.length > 0
    ? product.prices[0].currency
    : 'USD';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    url: `${baseUrl}/${locale}/store/${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Vip Acess',
    },
    offers: {
      '@type': 'AggregateOffer',
      url: `${baseUrl}/${locale}/store/${product.id}`,
      priceCurrency: currency,
      lowPrice: lowestPrice,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Vip Acess',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface WebsiteStructuredDataProps {
  locale: string;
}

/**
 * Structured Data for the main website/organization
 * Should be included on the home page
 */
export function WebsiteStructuredData({ locale }: WebsiteStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telegramvipacess.com';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vip Acess',
    description: 'Exclusive premium digital content platform',
    url: `${baseUrl}/${locale}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/store?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vip Acess',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Breadcrumb structured data for better navigation understanding
 */
interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
