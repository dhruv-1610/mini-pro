import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function HeroSection(): React.ReactElement {
  return (
    <section
      className="relative min-h-[90vh] overflow-hidden hero-gradient pt-24 pb-16 sm:pt-32 sm:pb-24"
      aria-labelledby="hero-heading"
    >
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl"
          aria-hidden
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-32 top-1/2 h-80 w-80 rounded-full bg-primary-300/30 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Clean streets.{' '}
            <span className="text-primary-700">Real impact.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-stone-600 sm:text-xl md:text-2xl"
          >
            Community-driven cleanup with full transparency. Report spots, join
            drives, and track every kilogram collected and rupee raised.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/reports/new"
                className="inline-flex items-center justify-center rounded-2xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 w-full min-w-[180px] sm:w-auto"
              >
                Report Spot
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/drives"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 w-full min-w-[180px] sm:w-auto"
              >
                Explore Drives
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
