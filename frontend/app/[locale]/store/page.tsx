'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { productAPI, Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import BlackFridayPopup from '@/components/BlackFridayPopup';

export default function StorePage() {
  const t = useTranslations('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blackFridayPromo, setBlackFridayPromo] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productAPI.getAll();
        setProducts(data.products);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPromoStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings/public`);
        const data = await response.json();
        setBlackFridayPromo(data.blackFridayPromo || false);
      } catch (err) {
        console.error('Failed to fetch promo status:', err);
      }
    };

    fetchProducts();
    fetchPromoStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-emerald"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-16 px-3 md:px-4">
      {/* Black Friday Popup */}
      {blackFridayPromo && <BlackFridayPopup />}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          {blackFridayPromo && (
            <div className="inline-block mb-4 animate-bounce">
              <span className="bg-gradient-to-r from-accent-emerald via-accent-gold to-accent-lime text-white font-bold text-sm md:text-lg px-4 md:px-6 py-2 rounded-full uppercase tracking-wider shadow-lg">
                🔥 Black Friday - 10% OFF em Tudo! 🔥
              </span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3 md:mb-4 text-accent-emerald">
            {t('title')}
          </h1>
          <p className="text-base md:text-xl text-gray-400 mb-4">{t('subtitle')}</p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">{t('noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showDiscount={blackFridayPromo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
