import { Link } from 'react-router-dom';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/map', label: 'Map' },
  { href: '/drives', label: 'Drives' },
  { href: '/transparency', label: 'Transparency' },
  { href: '/contact', label: 'Contact' },
];

export function Footer(): React.ReactElement {
  return (
    <footer
      className="mt-auto border-t border-stone-200 bg-white"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-primary-900"
            aria-label="CleanupCrew home"
          >
            CLEANUPCREW
          </Link>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-500 transition-colors hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-stone-100 pt-8 text-center text-sm text-stone-500">
          <p>© {new Date().getFullYear()} CleanupCrew. Community-driven civic cleanup.</p>
        </div>
      </div>
    </footer>
  );
}
