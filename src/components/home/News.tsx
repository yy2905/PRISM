'use client';

import { motion } from 'framer-motion';
import { useMessages } from '@/lib/i18n/useMessages';

export interface NewsItem {
  date: string;
  content: string;
}

interface NewsProps {
  items: NewsItem[];
  title?: string;
}

function renderNewsContent(raw: string) {
  const m = raw.match(/^([^:]{3,40}):\s*(.*)$/);
  if (!m) return <span>{raw}</span>;

  const label = m[1].trim();
  const rest = m[2];

  return (
    <>
      <span className="font-semibold text-accent">{label}:</span>{' '}
      <span>{rest}</span>
    </>
  );
}

export default function News({ items, title }: NewsProps) {
  const messages = useMessages();
  const resolvedTitle = title || messages.home.news;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <h2 className="text-2xl font-serif font-bold text-primary mb-0.5">
        {resolvedTitle}
      </h2>
<div className="w-17 h-[2px] bg-accent mb-6 rounded"></div>


      <div className="relative">
        <div className="absolute left-[95px] top-2 bottom-2 w-px bg-neutral-200/70" />

        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[75px_16px_minmax(0,1fr)] gap-x-3 items-start"
            >
              <div className="text-sm text-neutral-500 leading-5">
                {item.date}
              </div>

              <div className="relative flex justify-center">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              </div>

              <div className="text-[13px] leading-[1.3] text-neutral-700">
                {renderNewsContent(item.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}