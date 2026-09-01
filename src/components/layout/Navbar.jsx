'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/theme/ThemeProvider';
import { 
  Tractor, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Users, 
  Truck, 
  Navigation, 
  Layers, 
  Network as NetworkIcon, 
  BrainCircuit, 
  Route, 
  Menu, 
  X,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Farmer Portal', href: '/farmer', icon: Users },
    { name: 'Fleet Manager', href: '/vehicles', icon: Truck },
    { name: 'T1: Routing', href: '/routing', icon: Navigation },
    { name: 'T2: Allocation', href: '/allocation', icon: Layers },
    { name: 'T3: Network', href: '/network', icon: NetworkIcon },
    { name: 'T4: TOPSIS', href: '/decision-support', icon: BrainCircuit },
    { name: 'T5: GA Tours', href: '/tour-optimization', icon: Route },
  ];

  const microservices = [
    { name: 'Core Service', port: 8080, path: '/vehicles', desc: 'Machinery & Bookings Database' },
    { name: 'Route Optimization', port: 8081, path: '/routing/nodes', desc: 'A* & Dijkstra Network Engine' },
    { name: 'Resource Allocation', port: 8082, path: '/allocation/batches', desc: 'Hungarian & Greedy Dispatch' },
    { name: 'Network Analysis', port: 8083, path: '/network-analysis/cuts', desc: 'Tarjan Bridges & Kruskal MST' },
    { name: 'Decision Support', port: 8084, path: '/decision/topsis/runs', desc: 'TOPSIS & Harvest Delay ML' },
    { name: 'Tour Optimization', port: 8085, path: '/tours/optimize-sequence', desc: 'Genetic Algorithm TSP Engine' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b101d]/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-300 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Tractor className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              AGRI<span className="text-emerald-500">FLEET</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-widest hidden sm:inline-block">
                IDSS
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex space-x-1 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'opacity-70'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls (Status & Dark Mode Switcher) */}
        <div className="flex items-center space-x-2">
          
          {/* Microservice Live Status Button */}
          <button
            onClick={() => setStatusModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700/60"
            title="View Microservices Status"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Services</span>
            <Activity className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700/60"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Microservices Live Health Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold">Microservices Network Status</h3>
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {microservices.map((ms) => (
                <div
                  key={ms.port}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {ms.name}
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Port {ms.port}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{ms.desc}</div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Status Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}