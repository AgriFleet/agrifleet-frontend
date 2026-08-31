import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/context/ToastContext';
import StartupSplashScreen from '@/components/ui/StartupSplashScreen';

export const metadata = {
  title: 'AgriFleet IDSS - Smart Agricultural Logistics',
  description: 'Real-world machinery dispatch, route optimization, and intelligent decision support for farmers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 font-sans transition-colors duration-300">
        <ThemeProvider>
          <ToastProvider>
            <StartupSplashScreen />
            <Navbar />
            
            <main className="flex-1 w-full flex flex-col relative overflow-hidden">
              {children}
            </main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
