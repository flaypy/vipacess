'use client';

import { useParams, usePathname } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { locales, type Locale } from '@/i18n';

const languageNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as Locale;

  const handleChange = (newLocale: Locale) => {
    // Get the pathname without the locale prefix
    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    router.replace(pathnameWithoutLocale, { locale: newLocale });
  };

  return (
    <div className="relative">
      <select
        value={currentLocale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="bg-noir-medium border border-noir-light text-gray-300 px-4 py-2 rounded-lg
        hover:border-accent-emerald focus:border-accent-emerald focus:outline-none
        focus:ring-2 focus:ring-accent-emerald/20 transition-all cursor-pointer"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {languageNames[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
