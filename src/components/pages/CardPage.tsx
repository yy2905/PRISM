'use client';

import { motion } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';
import { CardPageConfig } from '@/types/page';

type TermSeason = 'Winter' | 'Spring' | 'Summer' | 'Fall';

function parseTerm(dateStr?: string): { season: TermSeason; year: number } | null {
  if (!dateStr) return null;

  const m = dateStr.trim().match(/^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i);
  if (!m) return null;

  const season = (m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) as TermSeason;
  const year = Number(m[2]);
  if (!Number.isFinite(year)) return null;

  return { season, year };
}

function termKey(season: TermSeason, year: number) {
  const seasonOrder: Record<TermSeason, number> = {
    Winter: 0,
    Spring: 1,
    Summer: 2,
    Fall: 3,
  };
  return year * 10 + seasonOrder[season];
}

function currentTermKeyToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let season: TermSeason = 'Spring';
  if (month === 12 || month === 1 || month === 2) season = 'Winter';
  else if (month >= 3 && month <= 5) season = 'Spring';
  else if (month >= 6 && month <= 8) season = 'Summer';
  else season = 'Fall';

  return termKey(season, year);
}

function isSemesterLine(line: string): boolean {
  return /^(Winter|Spring|Summer|Fall)\s+\d{4}$/i.test(line.trim());
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="mb-4 text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-500">
        {children}
      </div>
      <div className="mb-6 h-px bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function CardPage({
  config,
  embedded = false,
}: {
  config: CardPageConfig;
  embedded?: boolean;
}) {
  const todayKey = useMemo(() => currentTermKeyToday(), []);
  const isLifePage = config.title === 'Life';
  const isProjectsPage = config.title === 'Projects';

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

    incoming.sort((a, b) => (a.key! - b.key!) || (a.idx - b.idx));
    past.sort((a, b) => (b.key! - a.key!) || (a.idx - b.idx));

    return { current, incoming, past, unknown };
  }, [config.items, todayKey]);

  const tagGrouping = useMemo(() => {
    const items = config.items ?? [];

    const groups = new Map<string, any[]>();
    for (const item of items) {
      const group = (item.tags && item.tags.length > 0 ? item.tags[0] : 'Other') as string;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }

    if (groups.size <= 1) return null;

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

  const renderItemContent = (item: any) => {
    if (!item.content) return null;

    if (isProjectsPage) {
      return (
        <p
          className={`${
            embedded ? 'text-sm' : 'text-base'
          } leading-8 text-neutral-700 dark:text-neutral-400`}
        >
          {item.content}
        </p>
      );
    }

    return (
      <div
        className={`${
          embedded ? 'text-sm' : 'text-base'
        } font-normal leading-8 text-neutral-600 dark:text-neutral-500`}
      >
        {item.content.split(/\r?\n\r?\n/).map((block: string, blockIndex: number) => {
          const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          if (lines.length === 0) return null;

          const [firstLine, ...restLines] = lines;
          const semesterLine = isSemesterLine(firstLine);

          if (semesterLine) {
            return (
              <div key={blockIndex} className="mb-4 flex items-center gap-3 last:mb-0">
                <span className="text-lg font-bold leading-none text-accent">▍</span>
                <span className="font-semibold text-primary">{firstLine}</span>
              </div>
            );
          }

          return (
            <div key={blockIndex} className="mb-4 last:mb-0">
              <div className="font-normal text-neutral-600 dark:text-neutral-500">
                {firstLine}
              </div>

              {restLines.length > 0 && (
                <div
                  className="mt-1 whitespace-pre-line font-normal text-neutral-600 dark:text-neutral-500"
                  dangerouslySetInnerHTML={{ __html: restLines.join('<br/>') }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderItem = (item: any, index: number) => (
    <motion.div
      key={`${item.title}-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index }}
      className={
        isLifePage
          ? `group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 ${
              embedded ? 'p-4' : 'p-5'
            }`
          : `rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${
              embedded ? 'p-4' : 'p-6'
            }`
      }
    >
      {isLifePage ? (
        <div className="grid items-start gap-5 md:grid-cols-[140px_1fr]">
          {item.image && (
            <div className="aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
              <img
                src={item.image}
                alt={item.title || 'Life image'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h3
                className={`${
                  embedded ? 'text-lg' : 'text-2xl'
                } leading-tight font-semibold text-primary`}
              >
                {item.title}
              </h3>

              {item.date && (
                <span className="shrink-0 rounded-xl bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-500 dark:bg-neutral-800">
                  {item.date}
                </span>
              )}
            </div>

            {item.subtitle && (
              <p className={`${embedded ? 'text-sm' : 'text-lg'} mb-3 font-medium text-accent`}>
                {item.subtitle}
              </p>
            )}

            {item.content && (
              <p
                className={`${
                  embedded ? 'text-sm' : 'text-base'
                } leading-8 text-neutral-700 dark:text-neutral-400`}
              >
                {item.content}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-start justify-between">
            <h3 className={`${embedded ? 'text-lg' : 'text-xl'} font-semibold text-primary`}>
              {item.title}
            </h3>

            {item.date && (
              <span className="rounded bg-neutral-100 px-2 py-1 text-sm font-medium text-neutral-500 dark:bg-neutral-800">
                {item.date}
              </span>
            )}
          </div>

          {item.subtitle && (
            <p className={`${embedded ? 'text-sm' : 'text-base'} mb-3 font-medium text-accent`}>
              {item.subtitle}
            </p>
          )}

          {renderItemContent(item)}

          {item.links && Array.isArray(item.links) && item.links.length > 0 && (
            <div className="mt-4 space-y-2">
              {item.links.map((l: any) => (
                <a
                  key={l.href}
                  href={l.href}
                  target={l.href?.startsWith('http') ? '_blank' : undefined}
                  rel={l.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block text-sm font-medium text-accent transition-colors hover:underline"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          {item.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded border border-neutral-100 bg-neutral-50 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className={embedded ? 'mb-4' : 'mb-8'}>
        <h1 className={`${embedded ? 'text-2xl' : 'text-4xl'} mb-4 font-serif font-bold text-primary`}>
          {config.title}
        </h1>

        {config.description && (
          <p
            className={`${
              embedded ? 'text-base' : 'text-lg'
            } max-w-2xl text-neutral-600 dark:text-neutral-500`}
          >
            {config.description}
          </p>
        )}
      </div>

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