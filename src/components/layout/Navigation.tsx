'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Disclosure, Menu } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import type { SiteConfig } from '@/lib/config';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';
import type { I18nRuntimeConfig } from '@/types/i18n';

interface NavigationProps {
  items: SiteConfig['navigation'];
  siteTitle: string;
  enableOnePageMode?: boolean;
  i18n: I18nRuntimeConfig;
  itemsByLocale?: Record<string, SiteConfig['navigation']>;
  siteTitleByLocale?: Record<string, string>;
}

export default function Navigation({
  items,
  siteTitle,
  enableOnePageMode,
  i18n,
  itemsByLocale,
  siteTitleByLocale,
}: NavigationProps) {
  const pathname = usePathname();
  const locale = useLocaleStore((state) => state.locale);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const messages = useMessages();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    top: number;
    height: number;
  } | null>(null);

  const effectiveItems = useMemo(() => {
    if (!i18n.enabled) return items;
    return itemsByLocale?.[locale] || itemsByLocale?.[i18n.defaultLocale] || items;
  }, [i18n.defaultLocale, i18n.enabled, items, itemsByLocale, locale]);


const { topLevelItems, childrenByParentTitle } = useMemo(() => {
  const map = new Map<string, SiteConfig['navigation'][number][]>();

  const groups = effectiveItems.filter((i) => i.type === 'group');
  const pages = effectiveItems.filter((i) => i.type === 'page');

  groups.forEach((g) => map.set(g.title, []));

  pages.forEach((p) => {
    const parentTitle = (p as any).parent as string | undefined;
    if (parentTitle && map.has(parentTitle)) {
      map.get(parentTitle)!.push(p);
    }
  });

  const top = effectiveItems.filter((i) => {
    if (i.type !== 'page') return true;
    const parentTitle = (i as any).parent as string | undefined;
    return !parentTitle;
  });

  return { topLevelItems: top, childrenByParentTitle: map };
}, [effectiveItems]);



  const effectiveSiteTitle = useMemo(() => {
    if (!i18n.enabled) return siteTitle;
    return siteTitleByLocale?.[locale] || siteTitleByLocale?.[i18n.defaultLocale] || siteTitle;
  }, [i18n.defaultLocale, i18n.enabled, locale, siteTitle, siteTitleByLocale]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleSections = useRef(new Set<string>());

  useEffect(() => {
    if (enableOnePageMode) {
      setActiveHash(window.location.hash);
      const handleHashChange = () => setActiveHash(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);

      visibleSections.current.clear();

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.current.add(entry.target.id);
          } else {
            visibleSections.current.delete(entry.target.id);
          }
        });

        const firstVisible = effectiveItems.find(
          (item) => item.type === 'page' && visibleSections.current.has(item.target)
        );
        if (firstVisible) {
          setActiveHash(firstVisible.target === 'about' ? '' : `#${firstVisible.target}`);
        }
      };

      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);

      effectiveItems.forEach((item) => {
        if (item.type === 'page') {
          const element = document.getElementById(item.target);
          if (element) observer.observe(element);
        }
      });

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
        observer.disconnect();
      };
    }
  }, [enableOnePageMode, effectiveItems]);

  const isDesktopItemActive = (item: SiteConfig['navigation'][number]) =>
    enableOnePageMode
      ? activeHash === `#${item.target}` || (!activeHash && item.target === 'about')
      : (item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href));

const getGroupChildren = useCallback(
  (groupTitle: string) => childrenByParentTitle.get(groupTitle) ?? [],
  [childrenByParentTitle]
);

const isGroupActive = useCallback(
  (groupTitle: string) => getGroupChildren(groupTitle).some((c) => isDesktopItemActive(c)),
  [getGroupChildren, isDesktopItemActive]
);

  const getDesktopItemHref = (item: SiteConfig['navigation'][number]) =>
    enableOnePageMode ? `/#${item.target}` : item.href;

  const activeItem = effectiveItems.find((item) => isDesktopItemActive(item)) ?? null;
  const activeHref = activeItem ? getDesktopItemHref(activeItem) : null;
  const indicatorHref = hoveredHref ?? activeHref;

  const measureIndicator = useCallback(() => {
    const container = navContainerRef.current;
    if (!container || !indicatorHref) {
      setIndicatorStyle(null);
      return;
    }
    const el = container.querySelector<HTMLElement>(
      `[data-nav-href="${CSS.escape(indicatorHref)}"]`
    );
    if (!el) {
      setIndicatorStyle(null);
      return;
    }
    setIndicatorStyle({
      left: el.offsetLeft,
      width: el.offsetWidth,
      top: el.offsetTop,
      height: el.offsetHeight,
    });
  }, [indicatorHref]);

  useEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  useEffect(() => {
    window.addEventListener('resize', measureIndicator);
    return () => window.removeEventListener('resize', measureIndicator);
  }, [measureIndicator]);

  return (
    <Disclosure as="nav" className="fixed top-0 left-0 right-0 z-50">
      {({ open }) => (
        <>
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              'transition-all duration-300 ease-out',
              scrolled
                ? 'bg-background/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-lg'
                : 'bg-transparent'
            )}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16 lg:h-20">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0"
                >
                  <Link
                    href="/"
                    className="text-xl lg:text-2xl font-serif font-semibold text-primary hover:text-accent transition-colors duration-200"
                  >
                    {effectiveSiteTitle}
                  </Link>
                </motion.div>

                <div className="hidden lg:block">
                  <div className="ml-10 flex items-center space-x-3">
                    <div
                      ref={navContainerRef}
                      className="relative flex items-baseline space-x-1"
                      onMouseLeave={() => setHoveredHref(null)}
                    >
                      {indicatorStyle && (
                        <motion.div
                          className={cn(
                            'absolute rounded-lg pointer-events-none',
                            hoveredHref && hoveredHref !== activeHref
                              ? 'bg-accent/[0.07]'
                              : 'bg-accent/10'
                          )}
                          initial={false}
                          animate={{
                            left: indicatorStyle.left,
                            width: indicatorStyle.width,
                            top: indicatorStyle.top,
                            height: indicatorStyle.height,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                          }}
                        />
                      )}

{topLevelItems.map((item) => {
  // ✅ GROUP：下拉菜单
  if (item.type === 'group') {
    const children = getGroupChildren(item.title);
    const active = isGroupActive(item.title);

    // 给 indicator 一个“代表 href”（用第一个子页面即可）
    const groupHref = enableOnePageMode
      ? (children[0] ? `/#${children[0].target}` : '/')
      : (children[0]?.href ?? '/');

    return (
      <Menu key={`group-${item.title}`} as="div" className="relative">
        <Menu.Button
          data-nav-href={groupHref}
          onMouseEnter={() => setHoveredHref(groupHref)}
          className={cn(
            'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
            active ? 'text-primary' : (hoveredHref === groupHref ? 'text-primary' : 'text-neutral-600')
          )}
        >
          {item.title}
        </Menu.Button>

        <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl border border-neutral-200/60 bg-background/95 backdrop-blur-xl shadow-lg focus:outline-none">
          <div className="p-1">
            {children.map((child) => {
              const href = getDesktopItemHref(child);
              const childActive = isDesktopItemActive(child);

              return (
                <Menu.Item key={`child-${item.title}-${child.target}`}>
                  {() => (
                    <Link
                      href={href}
                      prefetch={true}
                      onMouseEnter={() => setHoveredHref(href)}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm transition-colors',
                        childActive ? 'text-primary bg-accent/10' : 'text-neutral-700 hover:bg-neutral-100/70'
                      )}
                    >
                      {child.title}
                    </Link>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Menu>
    );
  }

  // 普通 PAGE：原样
  const isActive = isDesktopItemActive(item);
  const href = getDesktopItemHref(item);

  return (
    <Link
      key={`page-${item.target}`}
      href={href}
      data-nav-href={href}
      prefetch={true}
      onClick={() => enableOnePageMode && setActiveHash(`#${item.target}`)}
      onMouseEnter={() => setHoveredHref(href)}
      className={cn(
        'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
        isActive ? 'text-primary' : hoveredHref === href ? 'text-primary' : 'text-neutral-600'
      )}
    >
      {item.title}
    </Link>
  );
})}
                    </div>
                    <LanguageToggle i18n={i18n} />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="lg:hidden flex items-center space-x-2">
                  <LanguageToggle i18n={i18n} />
                  <ThemeToggle />
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent transition-colors duration-200">
                    <span className="sr-only">{messages.navigation.openMainMenu}</span>
                    <motion.div
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </motion.div>
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {open && (
              <Disclosure.Panel static>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-neutral-200/50 shadow-lg"
                >
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {topLevelItems.map((item, index) => {
  // ✅ GROUP：手机端用“标题 + 缩进子项”显示（最稳，不会炸）
  if (item.type === 'group') {
    const children = getGroupChildren(item.title);

    return (
      <div key={`m-group-${item.title}`} className="pt-2">
        <div className="px-3 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          {item.title}
        </div>

        {children.map((child) => {
          const href = enableOnePageMode
            ? (child.href === '/' ? '/' : `/#${child.target}`)
            : child.href;

          const isActive = enableOnePageMode
            ? activeHash === `#${child.target}`
            : (child.href === '/' ? pathname === '/' : pathname.startsWith(child.href));

          return (
            <Disclosure.Button
              key={`m-child-${item.title}-${child.target}`}
              as={Link}
              href={href}
              prefetch={true}
              onClick={() => enableOnePageMode && setActiveHash(child.href === '/' ? '' : `#${child.target}`)}
              className={cn(
                'block px-3 py-2 pl-6 rounded-md text-base font-medium transition-all duration-200',
                isActive
                  ? 'text-primary bg-accent/10 border-l-4 border-accent'
                  : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
              )}
            >
              {child.title}
            </Disclosure.Button>
          );
        })}
      </div>
    );
  }

  // ✅ 普通 PAGE：保持原来的手机按钮逻辑
  const isActive = enableOnePageMode
    ? (item.href === '/' ? pathname === '/' && !activeHash : activeHash === `#${item.target}`)
    : (item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.href));

  const href = enableOnePageMode
    ? (item.href === '/' ? '/' : `/#${item.target}`)
    : item.href;

  return (
    <motion.div
      key={`m-page-${item.target}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Disclosure.Button
        as={Link}
        href={href}
        prefetch={true}
        onClick={() => enableOnePageMode && setActiveHash(item.href === '/' ? '' : `#${item.target}`)}
        className={cn(
          'block px-3 py-2 rounded-md text-base font-medium transition-all duration-200',
          isActive
            ? 'text-primary bg-accent/10 border-l-4 border-accent'
            : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
        )}
      >
        {item.title}
      </Disclosure.Button>
    </motion.div>
  );
})}                   
 </div>
                </motion.div>
              </Disclosure.Panel>
            )}
          </AnimatePresence>
        </>
      )}
    </Disclosure>
  );
}
