'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/scanner', label: 'Scanner' }
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-200 md:p-4 dark:md:border-slate-700">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-lg p-3 ${pathname === item.href ? 'bg-brand-500 text-white' : ''}`}>
            {item.label}
          </Link>
        ))}
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white p-2 md:hidden dark:border-slate-700 dark:bg-slate-900">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`text-center text-xs ${pathname === item.href ? 'text-brand-500' : 'text-slate-500'}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
