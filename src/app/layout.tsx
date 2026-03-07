import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getConfig } from '@/lib/config';
import MobileMenu from '@/components/layout/MobileMenu';

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

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <button className="hover:text-primary transition-colors">
        {label}
      </button>

      <div className="absolute left-0 top-full hidden min-w-[220px] pt-2 group-hover:block">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex flex-col py-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DropdownLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getConfig();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href={config.site.favicon} type="image/svg+xml" />
      </head>

      <body className="font-sans antialiased bg-white text-neutral-900">

        <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">

          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

            <Link
              href="/"
              className="text-lg font-serif font-semibold text-primary"
            >
              {config.site.title}
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-700">

              <Link
                href="/"
                className="hover:text-primary transition-colors"
              >
                About
              </Link>

              <NavDropdown label="Research">
                <DropdownLink href="/publications">Publications</DropdownLink>
                <DropdownLink href="/projects">Projects</DropdownLink>
              </NavDropdown>

              <NavDropdown label="Teaching">
                <DropdownLink href="/courses">Courses</DropdownLink>
                <DropdownLink href="/resources">Resources</DropdownLink>
              </NavDropdown>

              <Link
                href="/life"
                className="hover:text-primary transition-colors"
              >
                Life
              </Link>

              <Link
                href="/cv"
                className="hover:text-primary transition-colors"
              >
                CV
              </Link>

            </nav>

            <MobileMenu />

          </div>

        </header>

        <main className="min-h-screen pt-24">
          {children}
        </main>

      </body>
    </html>
  );
}