import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getConfig } from '@/lib/config';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getConfig();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href={config.site.favicon} type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased bg-white text-neutral-900">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-serif font-semibold text-primary">
              {config.site.title}
            </Link>

            <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
              <Link href="/" className="hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/publications" className="hover:text-primary transition-colors">
                Publications
              </Link>
              <Link href="/projects" className="hover:text-primary transition-colors">
                Projects
              </Link>
              <Link href="/teaching" className="hover:text-primary transition-colors">
                Teaching
              </Link>
              <Link href="/courses" className="hover:text-primary transition-colors">
                Courses
              </Link>
              <Link href="/resources" className="hover:text-primary transition-colors">
                Resources
              </Link>
              <Link href="/life" className="hover:text-primary transition-colors">
                Life
              </Link>
              <Link href="/cv" className="hover:text-primary transition-colors">
                CV
              </Link>
            </nav>
          </div>
        </header>

        <main className="min-h-screen pt-24">
          {children}
        </main>
      </body>
    </html>
  );
}