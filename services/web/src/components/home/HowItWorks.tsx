import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Report',
    description: 'Spot litter or illegal dumping? Report it with a photo and location. Our team verifies each report.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    href: '/reports/new',
  },
  {
    title: 'Organize',
    description: 'We create a cleanup drive, set goals, and open volunteer slots. Fundraising helps cover equipment and logistics.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/drives',
  },
  {
    title: 'Clean',
    description: 'Volunteers show up, get checked in, and clean the area. Impact metrics (waste, area, hours) are recorded.',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    href: '/drives',
  },
];

export function HowItWorks(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="bg-white py-20 sm:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl"
          >
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            Three simple steps from report to clean streets.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Link
                to={step.href}
                className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-8 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200">
                  {step.icon}
                </span>
                <h3 className="mt-6 text-xl font-semibold text-stone-900">
                  {step.title}
                </h3>
                <p className="mt-3 flex-1 text-stone-600">
                  {step.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-primary-700">
                  Learn more
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
