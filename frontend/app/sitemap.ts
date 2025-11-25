import { MetadataRoute } from 'next';
import { locales } from '@/i18n';

// This generates a dynamic sitemap for all pages and products
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://telegramacessovip.com';

  // Static pages for each locale
  const staticPages: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    // Home page
    staticPages.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${baseUrl}/en`,
          pt: `${baseUrl}/pt`,
          es: `${baseUrl}/es`,
        },
      },
    });

    // Store page
    staticPages.push({
      url: `${baseUrl}/${locale}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/en/store`,
          pt: `${baseUrl}/pt/store`,
          es: `${baseUrl}/es/store`,
        },
      },
    });
  });

  // Dynamic product pages
  // Fetch all active products from the API
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Fetch products for each locale to get region-specific products
    for (const locale of locales) {
      const response = await fetch(`${backendUrl}/api/products`, {
        headers: {
          'Accept-Language': locale,
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];

        products.forEach((product: { id: string; updatedAt?: string }) => {
          productPages.push({
            url: `${baseUrl}/${locale}/store/${product.id}`,
            lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    // Continue with static pages even if product fetch fails
  }

  return [...staticPages, ...productPages];
}
