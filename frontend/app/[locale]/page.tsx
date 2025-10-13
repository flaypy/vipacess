import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { WebsiteStructuredData } from '@/components/StructuredData';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <>
      {/* SEO Structured Data */}
      <WebsiteStructuredData locale={locale} />

      <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-noir-darker via-noir-dark to-noir-darker opacity-90" />

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.1),transparent_50%)]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-6xl pb-3 md:text-8xl font-serif font-bold mb-6 bg-gradient-to-r from-accent-gold via-accent-rose to-accent-purple bg-clip-text text-transparent animate-pulse leading-relaxed">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            {t('subtitle')}
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto italic">
            {t('tagline')}
          </p>
          <Link href="/store" className="btn-primary inline-block text-lg">
            {t('exploreButton')}
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-noir-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center mb-16 text-accent-gold">
            {t('featuresTitle')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-noir text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gold/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-accent-gold">
                {t('feature1Title')}
              </h3>
              <p className="text-gray-400">{t('feature1Desc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="card-noir text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-rose/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent-rose"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-accent-rose">
                {t('feature2Title')}
              </h3>
              <p className="text-gray-400">{t('feature2Desc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="card-noir text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-purple/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-accent-purple">
                {t('feature3Title')}
              </h3>
              <p className="text-gray-400">{t('feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
