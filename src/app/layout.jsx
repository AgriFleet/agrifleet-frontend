import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'AgriFleet IDSS - Smart Agricultural Logistics',
  description: 'Real-world machinery dispatch, route optimization, and intelligent decision support for farmers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-emerald-200 selection:text-emerald-900">
        <Navbar />
        
        {/* 
          Removed the fixed 'max-w-7xl' and padding. 
          Individual pages will now handle their own widths (like max-w-[1400px]) 
          and edge-to-edge decorative background effects.
        */}
        <main className="flex-1 w-full flex flex-col relative overflow-hidden">
          {children}
        </main>
        
      </body>
    </html>
  );
}