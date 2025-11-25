'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

export default function ProductCard({ product, showDiscount = false }: ProductCardProps) {
  const t = useTranslations('store');

  // Sort prices by amount
  const sortedPrices = [...(product.prices || [])].sort((a, b) => a.amount - b.amount);

  // Get minimum price (cheapest)
  const minPrice = sortedPrices[0];

  // Get middle price (most bought)
  const middlePrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

  // Get second most expensive (recommended)
  const secondMostExpensive = sortedPrices.length >= 2
    ? sortedPrices[sortedPrices.length - 2]
    : sortedPrices[sortedPrices.length - 1];

  return (
    <Link href={`/store/${product.id}`} className="block">
      <div className="card-noir group cursor-pointer">
      {/* Image */}
      <div className="relative h-48 md:h-64 mb-3 md:mb-4 rounded-lg overflow-hidden bg-noir-medium">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            // Fallback for broken images
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        {!product.isActive && (
          <div className="absolute inset-0 bg-noir-darker/80 flex items-center justify-center">
            <span className="text-red-400 font-bold text-sm md:text-base">Inactive</span>
          </div>
        )}
        {showDiscount && product.isActive && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 z-10">
            <div className="bg-gradient-to-r from-accent-gold to-accent-lime text-white font-bold px-2 md:px-3 py-1 md:py-2 rounded-lg shadow-lg transform rotate-3 animate-pulse">
              <div className="text-xs uppercase tracking-wide">Black Friday</div>
              <div className="text-base md:text-lg">-10%</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg md:text-xl font-bold mb-2 text-accent-emerald group-hover:text-accent-lime transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3 md:mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price Options */}
        <div className="mb-4 space-y-2">
          {minPrice && (
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-gray-500">{t('priceFrom')}</span>
              <span className="font-bold text-gray-300">
                {minPrice.currency} {minPrice.amount.toFixed(2)}
              </span>
            </div>
          )}
          {middlePrice && (
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-gray-500">{t('mostBought')}</span>
              <span className="font-bold text-gray-300">
                {middlePrice.currency} {middlePrice.amount.toFixed(2)}
              </span>
            </div>
          )}
          {secondMostExpensive && (
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-gray-500">{t('recommended')}</span>
              <span className="font-bold text-accent-emerald">
                {secondMostExpensive.currency} {secondMostExpensive.amount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <span className="btn-secondary text-xs md:text-sm whitespace-nowrap w-full text-center">
            {t('viewDetails')}
          </span>
        </div>
      </div>
      </div>
    </Link>
  );
}
