'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { settingsAPI } from '@/lib/api';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();
  const [supportTelegram, setSupportTelegram] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsAPI.getPublicSettings();
        setSupportTelegram(data.supportTelegram);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="bg-noir-dark border-t border-noir-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © {currentYear} Vip Acess. {t('rights')}.
          </div>

          {/* Contact Support */}
          {supportTelegram && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{t('contact')}:</span>
              <a
                href={supportTelegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold hover:text-accent-emerald transition-colors text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                {t('supportTelegram')}
              </a>
            </div>
          )}

          {/* Language Switcher */}
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{t('selectLanguage')}:</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
