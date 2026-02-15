import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin', label: 'Admin' },
  { href: '/map', label: 'Map' },
  { href: '/drives', label: 'Drives' },
  { href: '/donate', label: 'Donate' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

const motionVariants = {
  hidden: { y: -24, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: -24, opacity: 0 },
};

export function Navbar(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={motionVariants}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-soft-md backdrop-blur-md'
          : 'bg-transparent'
      }`}
      role="banner"
      aria-label="Site navigation"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight text-primary-900 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
          aria-label="CleanupCrew home"
        >
          CLEANUPCREW
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex" role="menubar">
          {navLinks.map((link) => (
            <li key={link.href} role="none">
              <Link
                to={link.href}
                className="text-sm font-medium text-stone-600 transition-colors hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
                role="menuitem"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth buttons (placeholder) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-2xl px-4 py-2 text-sm font-medium text-stone-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-2xl bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Join
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-stone-200 bg-white/95 backdrop-blur-md md:hidden"
          >
            <ul className="flex flex-col px-4 py-4 gap-1" role="menu">
              {navLinks.map((link) => (
                <li key={link.href} role="none">
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-stone-600 hover:bg-stone-100 hover:text-primary-700"
                    role="menuitem"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-stone-200 pt-2" role="none">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-stone-600"
                  role="menuitem"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 block rounded-xl bg-primary-700 px-4 py-3 text-center text-base font-medium text-white"
                  role="menuitem"
                >
                  Join
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
