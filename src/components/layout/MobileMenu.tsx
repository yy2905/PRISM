'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
        aria-label="Toggle menu"
      >
        <div className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 bg-current"></span>
          <span className="block h-0.5 w-5 bg-current"></span>
          <span className="block h-0.5 w-5 bg-current"></span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg p-3 space-y-3 z-50">

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
      )}
    </div>
  );
}