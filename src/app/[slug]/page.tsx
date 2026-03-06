import { notFound } from 'next/navigation';
import { getPageConfig, getMarkdownContent, getBibtexContent } from '@/lib/content';
import { getConfig } from '@/lib/config';
import { parseBibTeX } from '@/lib/bibtexParser';
import DynamicPageClient, { type DynamicPageLocaleData } from '@/components/pages/DynamicPageClient';
import {
  BasePageConfig,
  PublicationPageConfig,
  TextPageConfig,
  CardPageConfig,
} from '@/types/page';

import { Metadata } from 'next';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';

function loadDynamicPageData(slug: string, locale?: string): DynamicPageLocaleData | null {
  const pageConfig = getPageConfig(slug, locale) as BasePageConfig | null;

  if (!pageConfig) {
    return null;
  }

  if (pageConfig.type === 'publication') {
    const pubConfig = pageConfig as PublicationPageConfig;
    const bibtex = getBibtexContent(pubConfig.source, locale);
    return {
      type: 'publication',
      config: pubConfig,
      publications: parseBibTeX(bibtex, locale),
    };
  }

  if (pageConfig.type === 'text') {
    const textConfig = pageConfig as TextPageConfig;
    const content = getMarkdownContent(textConfig.source, locale);
    return {
      type: 'text',
      config: textConfig,
      content,
    };
  }

  // card
  if (pageConfig.type === 'card') {
    return {
      type: 'card',
      config: pageConfig as CardPageConfig,
    };
  }

  // fallback: any unknown type (e.g., "courses", "resources") will render as card
  return {
    type: 'card',
    config: pageConfig as unknown as CardPageConfig,
  };


}

export function generateStaticParams() {
  const config = getConfig();

  const slugs = (config.navigation ?? [])
    .filter((nav) => nav.type === 'page' && nav.target !== 'about')
    .map((nav) => String(nav.target).replace(/^\/+/, '')) // ✅ 去掉开头的 /
    .filter(Boolean);

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug?: string } }): Promise<Metadata> {
  const slug = String(params?.slug ?? '').replace(/^\/+|\/+$/g, ''); // ✅ 去掉首尾 /

  const pageConfig = getPageConfig(slug) as BasePageConfig | null;
  if (!pageConfig) return {};

  return {
    title: pageConfig.title,
    description: pageConfig.description,
  };
}


export default async function DynamicPage({ params }: { params: { slug?: string } }) {
  const slug = String(params?.slug ?? '').replace(/^\/+|\/+$/g, ''); // ✅ 核心：保证是纯 slug

  if (!slug) notFound();

  const baseConfig = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(baseConfig.i18n);
  const targetLocales = runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];

  const dataByLocale: Record<string, DynamicPageLocaleData> = {};

  for (const locale of targetLocales) {
    const localizedData = loadDynamicPageData(slug, locale);
    if (localizedData) dataByLocale[locale] = localizedData;
  }

  const defaultData = loadDynamicPageData(slug);
  if (defaultData) {
    dataByLocale[runtimeI18n.defaultLocale] = dataByLocale[runtimeI18n.defaultLocale] || defaultData;
  }

  if (Object.keys(dataByLocale).length === 0) notFound();

  return <DynamicPageClient dataByLocale={dataByLocale} defaultLocale={runtimeI18n.defaultLocale} />;
}