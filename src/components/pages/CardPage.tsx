'use client';

import { motion } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';
import { CardPageConfig } from '@/types/page';

type TermSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';

function parseTerm(dateStr?: string): { season: TermSeason; year: number } | null {
  if (!dateStr) return null;

  // Match: "Spring 2026", "Fall 2025", etc.
  const m = dateStr.trim().match(/^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i);
  if (!m) return null;

  const season = (m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) as TermSeason;
  const year = Number(m[2]);
  if (!Number.isFinite(year)) return null;

  return { season, year };
}

// For ordering terms within/between groups
function termKey(season: TermSeason, year: number) {
  const seasonOrder: Record<TermSeason, number> = {
    Winter: 0,
    Spring: 1,
    Summer: 2,
    Fall: 3,
  };
  return year * 10 + seasonOrder[season];
}

// Approx "current term" based on today's month
function currentTermKeyToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Rough academic seasons:
  // Winter: 12-2, Spring: 3-5, Summer: 6-8, Fall: 9-11
  let season: TermSeason = 'Spring';
  if (month === 12 || month === 1 || month === 2) season = 'Winter';
  else if (month >= 3 && month <= 5) season = 'Spring';
  else if (month >= 6 && month <= 8) season = 'Summer';
  else season = 'Fall';

  return termKey(season, year);
}

/**
 * Optional: add a colored badge when item.content starts with:
 * "Article published: ..." / "Presentation: ..." etc.
 *
 * If it doesn't match a known label, it returns the raw string unchanged.
 */
function renderNewsContent(raw: string): ReactNode {
  const m = raw.match(/^([^:]{3,40}):\s*(.*)$/);
  if (!m) return raw;

  const label = m[1].trim();
  const rest = m[2];

  const badgeMap: Record<string, string> = {
    'Article published': 'bg-blue-700 text-white',
    Presentation: 'bg-emerald-700 text-white',
    'Poster presentation': 'bg-emerald-700 text-white',
    Awarded: 'bg-violet-700 text-white',
    Appointed: 'bg-amber-700 text-white',
    Served: 'bg-slate-700 text-white',
    Completed: 'bg-slate-700 text-white',
  };

  const cls = badgeMap[label];
  if (!cls) return raw;

  return (
    <>
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold mr-2 align-middle ${cls}`}
      >
        {label}
      </span>
      <span>{rest}</span>
    </>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="text-xs tracking-[0.18em] uppercase text-neutral-500 dark:text-neutral-500 mb-4">
        {children}
      </div>
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 mb-6" />
    </div>
  );
}

export default function CardPage({ config, embedded = false }: { config: CardPageConfig; embedded?: boolean }) {
  const todayKey = useMemo(() => currentTermKeyToday(), []);

  // 1) Term grouping (for courses-like pages)
  const grouping = useMemo(() => {
    const items = config.items ?? [];
    const parsed = items.map((item, idx) => {
      const t = parseTerm(item.date);
      return { item, idx, term: t, key: t ? termKey(t.season, t.year) : null };
    });

    const hasAnyTerm = parsed.some((x) => x.term && x.key !== null);
    if (!hasAnyTerm) return null;

    const current: typeof parsed = [];
    const incoming: typeof parsed = [];
    const past: typeof parsed = [];
    const unknown: typeof parsed = [];

    parsed.forEach((x) => {
      if (x.key === null) {
        unknown.push(x);
        return;
      }
      if (x.key === todayKey) current.push(x);
      else if (x.key > todayKey) incoming.push(x);
      else past.push(x);
    });

    // Sort:
    // - current: keep original order
    // - incoming: soonest first (ascending)
    // - past: most recent first (descending)
    incoming.sort((a, b) => (a.key! - b.key!) || (a.idx - b.idx));
    past.sort((a, b) => (b.key! - a.key!) || (a.idx - b.idx));

    return { current, incoming, past, unknown };
  }, [config.items, todayKey]);

  // 2) Tag grouping (for Resources-like pages): use item.tags[0] as category
  const tagGrouping = useMemo(() => {
    const items = config.items ?? [];

    const groups = new Map<string, any[]>();
    for (const item of items) {
      const group = (item.tags && item.tags.length > 0 ? item.tags[0] : 'Other') as string;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }

    // If only one group, don't group (keep original grid)
    if (groups.size <= 1) return null;

    // Optional: customize category order
    const preferredOrder = ['Teaching', 'Methods', 'Resources', 'Tools', 'Other'];
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return sortedKeys.map((key) => ({ key, items: groups.get(key)! }));
  }, [config.items]);

  const renderItem = (item: any, index: number) => (
    <motion.div
      key={`${item.title}-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index }}
      className={`bg-white dark:bg-neutral-900 ${embedded ? 'p-4' : 'p-6'} rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`${embedded ? 'text-lg' : 'text-xl'} font-semibold text-primary`}>{item.title}</h3>
        {item.date && (
          <span className="text-sm text-neutral-500 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
            {item.date}
          </span>
        )}
      </div>

      {item.subtitle && (
        <p className={`${embedded ? 'text-sm' : 'text-base'} text-accent font-medium mb-3`}>{item.subtitle}</p>
      )}

      {item.content && (
<p className={`${embedded ? 'text-sm' : 'text-base'} text-neutral-600 dark:text-neutral-500 leading-relaxed whitespace-pre-line`}>
  {renderNewsContent(item.content)}
</p>
      )}

      {item.links && Array.isArray(item.links) && item.links.length > 0 && (
        <div className="mt-4 space-y-2">
          {item.links.map((l: any) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href?.startsWith('http') ? '_blank' : undefined}
              rel={l.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="block text-sm text-accent font-medium hover:underline transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      {item.tags && (
        <div className="flex flex-wrap gap-2 mt-4">
          {item.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-100 dark:border-neutral-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
      <div className={embedded ? 'mb-4' : 'mb-8'}>
        <h1 className={`${embedded ? 'text-2xl' : 'text-4xl'} font-serif font-bold text-primary mb-4`}>{config.title}</h1>
        {config.description && (
          <p className={`${embedded ? 'text-base' : 'text-lg'} text-neutral-600 dark:text-neutral-500 max-w-2xl`}>
            {config.description}
          </p>
        )}
      </div>

      {/* Priority:
          1) term grouping (courses)
          2) tag grouping (resources)
          3) default grid
      */}
      {grouping ? (
        <div>
          {grouping.current.length > 0 && (
            <>
              <SectionTitle>CURRENT TERM</SectionTitle>
              <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
                {grouping.current.map((x, i) => renderItem(x.item, i))}
              </div>
            </>
          )}

          {grouping.incoming.length > 0 && (
            <>
              <SectionTitle>INCOMING TERM</SectionTitle>
              <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
                {grouping.incoming.map((x, i) => renderItem(x.item, i))}
              </div>
            </>
          )}

          {grouping.past.length > 0 && (
            <>
              <SectionTitle>PAST TERMS</SectionTitle>
              <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
                {grouping.past.map((x, i) => renderItem(x.item, i))}
              </div>
            </>
          )}

          {grouping.unknown.length > 0 && (
            <>
              <SectionTitle>OTHER</SectionTitle>
              <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
                {grouping.unknown.map((x, i) => renderItem(x.item, i))}
              </div>
            </>
          )}
        </div>
      ) : tagGrouping ? (
        <div>
          {tagGrouping.map((g, gi) => (
            <div key={g.key} className={gi === 0 ? '' : 'mt-10'}>
              <SectionTitle>{g.key}</SectionTitle>
              <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
                {g.items.map((item, index) => renderItem(item, index))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${embedded ? 'gap-4' : 'gap-6'}`}>
          {config.items.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </motion.div>
  );
}