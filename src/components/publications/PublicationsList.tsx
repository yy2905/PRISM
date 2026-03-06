'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';
import { PublicationPageConfig } from '@/types/page';
import { cn } from '@/lib/utils';
import { useMessages } from '@/lib/i18n/useMessages';

interface PublicationsListProps {
  config: PublicationPageConfig;
  publications: Publication[];
  embedded?: boolean;
}

/**
 * We only keep 3 buckets on this page:
 * - journal  -> "Journal Articles"
 * - chapter  -> "Book Chapters"
 * - working  -> "Working Papers"
 *
 * Anything conference-like is excluded here, because conference presentations
 * already have their own page.
 */
type PubBucket = 'journal' | 'chapter' | 'working';

const BUCKET_LABEL: Record<PubBucket, string> = {
  journal: 'Journal Articles',
  chapter: 'Book Chapters',
  working: 'Working Papers',
};

function isConferenceLike(pub: Publication): boolean {
  const t = (pub.type ?? '').toLowerCase().trim();

  // 只根据 type 判断是不是 conference
  const conferenceTokens = [
    'conference',
    'inproceedings',
    'proceedings',
    'workshop',
    'symposium',
    'meeting',
    'presentation',
  ];

  return conferenceTokens.some((kw) => t.includes(kw));
}

function bucketType(pub: Publication): PubBucket {
  const t = (pub.type ?? '').toLowerCase().trim();

  // journal-like
  if (t.includes('journal') || t.includes('article')) return 'journal';

  // chapter-like
  if (t.includes('incollection') || t.includes('chapter') || t.includes('book-chapter') || t.includes('book')) {
    return 'chapter';
  }

  // default bucket
  return 'working';
}

export default function PublicationsList({
  config,
  publications,
  embedded = false,
}: PublicationsListProps) {
  const messages = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<PubBucket | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBibtexId, setExpandedBibtexId] = useState<string | null>(null);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

  // 1) Remove all conference-like entries on this page
  const nonConferencePublications = useMemo(() => {
    return publications.filter((p) => !isConferenceLike(p));
  }, [publications]);

  // Extract unique years for filters (after removing conference)
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(nonConferencePublications.map((p) => p.year)));
    return uniqueYears.sort((a, b) => b - a);
  }, [nonConferencePublications]);

  // We hard-code the 3 buckets (always show them, but disable if count=0)
  const types = useMemo(() => {
    return ['journal', 'chapter', 'working'] as PubBucket[];
  }, []);

  // Count each bucket so we can disable empty ones
  const typeCounts = useMemo(() => {
    const counts: Record<PubBucket, number> = { journal: 0, chapter: 0, working: 0 };
    nonConferencePublications.forEach((p) => {
      counts[bucketType(p)] += 1;
    });
    return counts;
  }, [nonConferencePublications]);

  // Filter publications
  const filteredPublications = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return nonConferencePublications.filter((pub) => {
      const matchesSearch =
        q === '' ||
        pub.title.toLowerCase().includes(q) ||
        pub.authors.some((author) => author.name.toLowerCase().includes(q)) ||
        pub.journal?.toLowerCase().includes(q);

      const matchesYear = selectedYear === 'all' || pub.year === selectedYear;

      const pubBucket = bucketType(pub);
      const matchesType = selectedType === 'all' || pubBucket === selectedType;

      return matchesSearch && matchesYear && matchesType;
    });
  }, [nonConferencePublications, searchQuery, selectedYear, selectedType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="mb-8">
        <h1 className={`${embedded ? 'text-2xl' : 'text-4xl'} font-serif font-bold text-primary mb-4`}>
          {config.title}
        </h1>
        {config.description && (
          <p className={`${embedded ? 'text-base' : 'text-lg'} text-neutral-600 dark:text-neutral-500 max-w-2xl`}>
            {config.description}
          </p>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder={messages.publications.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200',
              showFilters
                ? 'bg-accent text-white border-accent'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:border-accent hover:text-accent'
            )}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            {messages.publications.filters}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-6">
                {/* Year Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" /> {messages.publications.year}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedYear('all')}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full transition-colors',
                        selectedYear === 'all'
                          ? 'bg-accent text-white'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      )}
                    >
                      {messages.common.all}
                    </button>
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                          'px-3 py-1 text-xs rounded-full transition-colors',
                          selectedYear === year
                            ? 'bg-accent text-white'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
                    <BookOpenIcon className="h-4 w-4 mr-1" /> {messages.publications.type}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedType('all')}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full transition-colors',
                        selectedType === 'all'
                          ? 'bg-accent text-white'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      )}
                    >
                      {messages.common.all}
                    </button>

                    {types.map((bucket) => {
                      const disabled = typeCounts[bucket] === 0;

                      return (
                        <button
                          key={bucket}
                          onClick={() => !disabled && setSelectedType(bucket)}
                          disabled={disabled}
                          className={cn(
                            'px-3 py-1 text-xs rounded-full transition-colors',
                            selectedType === bucket
                              ? 'bg-accent text-white'
                              : disabled
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                : 'bg-white dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          )}
                        >
                          {BUCKET_LABEL[bucket]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Publications Grid */}
      <div className="space-y-6">
        {filteredPublications.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            {messages.publications.noResults}
          </div>
        ) : (
          filteredPublications.map((pub, index) => (
            <motion.div
              key={pub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {pub.preview && (
                  <div className="w-full md:w-48 flex-shrink-0">
                    <div className="aspect-video md:aspect-[4/3] relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={`/papers/${pub.preview}`}
                        alt={pub.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                )}

                <div className="flex-grow">
                  <h3 className={`${embedded ? 'text-lg' : 'text-xl'} font-semibold text-primary mb-2 leading-tight`}>
                    {pub.title}
                  </h3>

                  <p className={`${embedded ? 'text-sm' : 'text-base'} text-neutral-600 dark:text-neutral-400 mb-2`}>
                    {pub.authors.map((author, idx) => (
                      <span key={idx}>
                        <span
                          className={`${author.isHighlighted ? 'font-semibold text-accent' : ''} ${
                            author.isCoAuthor
                              ? `underline underline-offset-4 ${
                                  author.isHighlighted ? 'decoration-accent' : 'decoration-neutral-400'
                                }`
                              : ''
                          }`}
                        >
                          {author.name}
                        </span>
                        {author.isCorresponding && (
                          <sup
                            className={`ml-0 ${author.isHighlighted ? 'text-accent' : 'text-neutral-600 dark:text-neutral-400'}`}
                          >
                            †
                          </sup>
                        )}
                        {idx < pub.authors.length - 1 && ', '}
                      </span>
                    ))}
                  </p>

                  {/* Publications page: show journal/book (no conference here) */}
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-600 mb-3">
                    {pub.journal ? `${pub.journal} ` : ''}
                    {pub.year}
                  </p>

                  {pub.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4 line-clamp-3">
                      {pub.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                      >
                        DOI
                      </a>
                    )}

                    {pub.code && (
                      <a
                        href={pub.code}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white transition-colors"
                      >
                        {messages.publications.code}
                      </a>
                    )}

                    {pub.abstract && (
                      <button
                        onClick={() => setExpandedAbstractId(expandedAbstractId === pub.id ? null : pub.id)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors',
                          expandedAbstractId === pub.id
                            ? 'bg-accent text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white'
                        )}
                      >
                        <DocumentTextIcon className="h-3 w-3 mr-1.5" />
                        {messages.publications.abstract}
                      </button>
                    )}

                    {pub.bibtex && (
                      <button
                        onClick={() => setExpandedBibtexId(expandedBibtexId === pub.id ? null : pub.id)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors',
                          expandedBibtexId === pub.id
                            ? 'bg-accent text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-accent hover:text-white'
                        )}
                      >
                        <BookOpenIcon className="h-3 w-3 mr-1.5" />
                        {messages.publications.bibtex}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedAbstractId === pub.id && pub.abstract ? (
                      <motion.div
                        key="abstract"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                          <p className="text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">
                            {pub.abstract}
                          </p>
                        </div>
                      </motion.div>
                    ) : null}

                    {expandedBibtexId === pub.id && pub.bibtex ? (
                      <motion.div
                        key="bibtex"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="relative bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                          <pre className="text-xs text-neutral-600 dark:text-neutral-500 overflow-x-auto whitespace-pre-wrap font-mono">
                            {pub.bibtex}
                          </pre>
                          <button
                            onClick={() => navigator.clipboard.writeText(pub.bibtex || '')}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-500 hover:text-accent shadow-sm border border-neutral-200 dark:border-neutral-600 transition-colors"
                            title={messages.common.copyToClipboard}
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}