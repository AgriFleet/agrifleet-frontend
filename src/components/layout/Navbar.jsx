'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Farmer Portal', href: '/farmer' },
    { name: 'Fleet Manager', href: '/vehicles' },
    { name: 'T1: Routing', href: '/routing' },
    { name: 'T2: Allocation', href: '/allocation' },
    { name: 'T3: Network', href: '/network' },
    { name: 'T4: TOPSIS', href: '/decision-support' },
    { name: 'T5: GA Tours', href: '/tour-optimization' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 pr-4">
          <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-sm tracking-wide">
            AGRI
          </span>
          <span className="font-bold text-lg tracking-tight hidden sm:block">Fleet IDSS</span>
        </div>

        <nav className="hidden lg:flex space-x-1 text-sm font-medium overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-800 text-emerald-400 font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}