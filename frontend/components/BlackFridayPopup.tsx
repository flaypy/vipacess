'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function BlackFridayPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations('common');

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = sessionStorage.getItem('blackFridayPopupSeen');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('blackFridayPopupSeen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-2xl w-full bg-gradient-to-br from-noir-dark via-noir-medium to-noir-dark border-2 border-accent-emerald rounded-2xl p-5 md:p-8 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Black Friday Badge */}
          <div className="inline-block mb-3 md:mb-4">
            <span className="bg-gradient-to-r from-accent-emerald via-accent-gold to-accent-lime text-white font-bold text-xs md:text-sm px-3 md:px-4 py-1 rounded-full uppercase tracking-wider animate-pulse">
              Black Friday
            </span>
          </div>

          {/* Main heading */}
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-emerald via-accent-gold to-accent-lime mb-3 md:mb-4">
            🔥 Promoção Especial! 🔥
          </h2>

          {/* Description */}
          <p className="text-lg md:text-2xl text-gray-200 mb-4 md:mb-6 font-semibold">
            10% de desconto em <span className="text-accent-emerald">TODOS</span> os produtos!
          </p>

          <p className="text-sm md:text-lg text-gray-400 mb-6 md:mb-8 px-2">
            Aproveite esta oferta exclusiva por tempo limitado e garanta acesso aos melhores conteúdos com preços incríveis!
          </p>

          {/* CTA Button */}
          <button
            onClick={handleClose}
            className="btn-primary text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-accent-emerald to-accent-gold hover:from-accent-gold hover:to-accent-lime transition-all duration-300 transform hover:scale-105 w-full md:w-auto"
          >
            Ver Produtos em Promoção
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-10 -left-10 w-32 h-32 md:w-40 md:h-40 bg-accent-emerald/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 md:w-40 md:h-40 bg-accent-gold/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
