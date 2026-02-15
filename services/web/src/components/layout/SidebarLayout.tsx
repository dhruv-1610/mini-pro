import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: SidebarNavItem[];
  title?: string;
}

export function SidebarLayout({
  children,
  navItems,
  title = 'Dashboard',
}: SidebarLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 flex-shrink-0 border-r border-stone-200 bg-white lg:block"
        aria-label="Dashboard navigation"
      >
        <div className="sticky top-24 flex h-[calc(100vh-6rem)] flex-col py-6">
          <h2 className="px-6 text-xs font-semibold uppercase tracking-wider text-stone-400">
            {title}
          </h2>
          <nav className="mt-4 flex-1 space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-primary-700"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          aria-label="Open dashboard menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-stone-900/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-stone-200 bg-white lg:hidden"
              aria-label="Dashboard navigation"
            >
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
                <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-primary-700"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
