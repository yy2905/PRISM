import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import { getConfig } from '@/lib/config';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';
import type { SiteConfig } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();

  return {
    title: {
      default: config.site.title,
      template: `%s | ${config.site.title}`,
    },
    description: config.site.description,
    keywords: [config.author.name, 'PhD', 'Research', config.author.institution],
    authors: [{ name: config.author.name }],
    creator: config.author.name,
    publisher: config.author.name,
    icons: {
      icon: config.site.favicon,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      title: config.site.title,
      description: config.site.description,
      siteName: `${config.author.name}'s Academic Website`,
    },
  };
}

function buildLocalizedConfigMaps(
  locales: string[]
): {
  navigationByLocale: Record<string, SiteConfig['navigation']>;
  siteTitleByLocale: Record<string, string>;
} {
  const navigationByLocale: Record<string, SiteConfig['navigation']> = {};
  const siteTitleByLocale: Record<string, string> = {};

  for (const locale of locales) {
    const localizedConfig = getConfig(locale);
    navigationByLocale[locale] = localizedConfig.navigation;
    siteTitleByLocale[locale] = localizedConfig.site.title;
  }

  return {
    navigationByLocale,
    siteTitleByLocale,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(config.i18n);
  const targetLocales = runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];

  const {
    navigationByLocale,
    siteTitleByLocale,
  } = buildLocalizedConfigMaps(targetLocales);

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href={config.site.favicon} type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased">
        <Navigation
          items={config.navigation}
          siteTitle={config.site.title}
          enableOnePageMode={config.features.enable_one_page_mode}
          i18n={runtimeI18n}
          itemsByLocale={navigationByLocale}
          siteTitleByLocale={siteTitleByLocale}
        />
        <main className="min-h-screen pt-16 lg:pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}