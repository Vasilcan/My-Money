import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../lib/repository';
import { TransactionModalProvider } from '../context/TransactionModalProvider';
import { useTransactionModal } from '../context/useTransactionModal';
import PWABadge from './PWABadge';

const navItems = [
  { path: '/', label: 'Acasă', icon: '🏠' },
  { path: '/transactions', label: 'Tranzacții', icon: '📋' },
  { path: '/analysis', label: 'Analiză', icon: '📊' },
  { path: '/settings', label: 'Setări', icon: '⚙️' },
];

function GlobalFAB() {
  const location = useLocation();
  const { openAddModal } = useTransactionModal();

  // Show FAB only on Home and Transactions pages
  if (location.pathname !== '/' && location.pathname !== '/transactions') {
    return null;
  }

  return (
    <button
      onClick={() => openAddModal('expense')}
      className="fixed z-40 bottom-20 right-4 lg:bottom-8 lg:right-8 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
      aria-label="Adaugă tranzacție"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}

export default function AppLayout() {
  const settings = useLiveQuery(() => getSettings(), []);

  useEffect(() => {
    if (!settings) return;
    
    const theme = settings.theme || 'system';
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.classList.add(theme);
    }
  }, [settings]);

  const navLinkClasses = 'flex items-center justify-center lg:justify-start gap-3 px-4 py-3 lg:py-2 text-sm font-medium rounded-xl transition-colors';
  const activeClasses = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
  const inactiveClasses = 'text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white dark:hover:text-white';

  return (
    <TransactionModalProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 overflow-hidden font-sans text-gray-900 dark:text-white dark:text-gray-100 transition-colors">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 dark:border-gray-700 shadow-sm z-20 transition-colors">
          <div className="p-6 pb-4">
            <h1 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
              <span className="text-3xl">👛</span> Finanțe
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 relative">
          <div className="w-full max-w-3xl lg:max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Nav for mobile */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-800/90 dark:bg-gray-800/90 backdrop-blur-md lg:hidden z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
          <div className="grid grid-cols-4 h-16 sm:h-18">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:hover:text-white'
                  }`
                }
              >
                <span className="text-xl sm:text-2xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] sm:text-xs font-semibold leading-none">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <GlobalFAB />
        <PWABadge />
      </div>
    </TransactionModalProvider>
  );
}
