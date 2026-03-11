'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="md:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <div className="relative h-5 w-5">
          <span
            className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-[7px] bg-current transition-all duration-200 ${
              open ? 'translate-y-0 rotate-45' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 block h-0.5 w-5 bg-current transition-all duration-200 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 block h-0.5 w-5 translate-y-[7px] bg-current transition-all duration-200 ${
              open ? 'translate-y-0 -rotate-45' : ''
            }`}
          />
        </div>
      </button>

      <div
        className={`absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg p-3 space-y-3 z-50 origin-top-right transition-all duration-200 ${
          open
            ? 'pointer-events-auto opacity-100 translate-y-0 scale-100'
            : 'pointer-events-none opacity-0 -translate-y-1 scale-95'
        }`}
      >
        <Link
          href="/"
          className="block text-sm font-medium text-neutral-800 hover:text-primary"
          onClick={() => setOpen(false)}
        >
          About
        </Link>

        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500 mb-2">
            Research
          </div>
          <div className="space-y-2 pl-3">
            <Link
              href="/publications"
              className="block text-sm text-neutral-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Publications
            </Link>

            <Link
              href="/projects"
              className="block text-sm text-neutral-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Projects
            </Link>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500 mb-2">
            Teaching
          </div>
          <div className="space-y-2 pl-3">
            <Link
              href="/courses"
              className="block text-sm text-neutral-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Courses
            </Link>

            <Link
              href="/resources"
              className="block text-sm text-neutral-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Resources
            </Link>

            <a
              href="https://yy2905.github.io/teaching/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-neutral-700 hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Teaching Site
            </a>
          </div>
        </div>

        <Link
          href="/life"
          className="block text-sm font-medium text-neutral-800 hover:text-primary"
          onClick={() => setOpen(false)}
        >
          Life
        </Link>

        <Link
          href="/cv"
          className="block text-sm font-medium text-neutral-800 hover:text-primary"
          onClick={() => setOpen(false)}
        >
          CV
        </Link>
      </div>
    </div>
  );
}