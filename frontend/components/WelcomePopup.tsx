'use client';

import { useState, useEffect } from 'react';
import { popupAPI, PopupConfig } from '@/lib/api';

export default function WelcomePopup() {
  const [popup, setPopup] = useState<PopupConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchPopupConfig();
  }, []);

  const fetchPopupConfig = async () => {
    try {
      const data = await popupAPI.getActive();

      // Only show popup if it's active and user hasn't seen it yet
      if (data.popup && data.popup.isActive) {
        const hasSeenPopup = localStorage.getItem('hasSeenWelcomePopup');

        if (!hasSeenPopup) {
          setPopup(data.popup);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to load popup config:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  const handleButtonClick = () => {
    handleClose();
    if (popup?.buttonLink) {
      window.open(popup.buttonLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || !popup) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={handleClose}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Popup modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md mx-4 animate-scaleIn"
        style={{
          animation: 'scaleIn 0.3s ease-out',
        }}
      >
        <div className="relative bg-gradient-to-br from-dark via-dark-lighter to-dark border-2 border-accent-emerald/30 rounded-lg shadow-2xl overflow-hidden">
          {/* Decorative gradient line at top */}
          <div className="h-1 bg-gradient-to-r from-accent-emerald via-accent-gold to-accent-lime" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Close popup"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="mb-6">
              <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                {popup.message}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleButtonClick}
              className="w-full bg-gradient-to-r from-accent-emerald to-accent-gold hover:from-accent-emerald/90 hover:to-accent-gold/90 text-dark font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-accent-emerald/50"
            >
              {popup.buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* CSS animations */}
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
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}
