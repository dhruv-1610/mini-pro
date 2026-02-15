import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PrimaryButton, Card } from '../components/ui';
import { useDrivesList } from '../hooks/useDrivesList';
import { useIsAuthenticated } from '../stores/authStore';
import { createDonationIntent, rupeesToPaise, MIN_AMOUNT_PAISE } from '../lib/donation';
import type { DriveSummary } from '../lib/api';

const PRESET_AMOUNTS_RUPEE = [100, 250, 500, 1000, 2500, 5000];
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function FundingProgressBar({ drive }: { drive: DriveSummary }): React.ReactElement {
  const goal = drive.fundingGoal ?? 1;
  const raised = drive.fundingRaised ?? 0;
  const pct = Math.min(100, (raised / goal) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-stone-600">Funding progress</span>
        <span className="font-semibold text-primary-700">
          ₹{(raised / 100).toLocaleString('en-IN')} / ₹{(goal / 100).toLocaleString('en-IN')}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
        />
      </div>
    </div>
  );
}

function CheckoutForm({
  amountRupee,
  driveTitle,
  onCancel,
}: {
  clientSecret: string;
  amountRupee: number;
  driveTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);
    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donate?success=1`,
          payment_method_data: {
            billing_details: {
              name: undefined,
              address: undefined,
            },
          },
        },
      });
      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-stone-600">
        Donating <span className="font-semibold text-stone-900">₹{amountRupee.toLocaleString('en-IN')}</span> to{' '}
        <span className="font-semibold text-stone-900">{driveTitle}</span>
      </p>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
        </motion.p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Back
        </button>
        <PrimaryButton type="submit" isLoading={loading} disabled={!stripe || !elements} className="flex-1">
          Pay ₹{amountRupee.toLocaleString('en-IN')}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function DonatePage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const successFromUrl = searchParams.get('success') === '1';
  const isAuthenticated = useIsAuthenticated();
  const { drives, loading: drivesLoading, error: drivesError } = useDrivesList();

  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [amountRupee, setAmountRupee] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [success, setSuccess] = useState(successFromUrl);

  const donatableDrives = useMemo(
    () => drives.filter((d) => d.status === 'planned' || d.status === 'active'),
    [drives]
  );
  const selectedDrive = selectedDriveId ? donatableDrives.find((d) => d._id === selectedDriveId) : null;

  useEffect(() => {
    if (successFromUrl) {
      setSuccess(true);
      setClientSecret(null);
      setSearchParams({}, { replace: true });
    }
  }, [successFromUrl, setSearchParams]);

  useEffect(() => {
    if (donatableDrives.length > 0 && !selectedDriveId) {
      setSelectedDriveId(donatableDrives[0]._id);
    }
  }, [donatableDrives, selectedDriveId]);

  const effectiveAmountRupee = customAmount.trim() ? parseFloat(customAmount) || 0 : amountRupee;
  const effectiveAmountPaise = rupeesToPaise(effectiveAmountRupee);
  const isValidAmount = effectiveAmountPaise >= MIN_AMOUNT_PAISE;

  const handleStartCheckout = async () => {
    if (!selectedDriveId || !isValidAmount || !isAuthenticated) return;
    setPaymentError(null);
    setIntentLoading(true);
    try {
      const { clientSecret: secret } = await createDonationIntent(selectedDriveId, effectiveAmountPaise);
      setClientSecret(secret);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : null;
      setPaymentError(typeof msg === 'string' ? msg : err instanceof Error ? err.message : 'Failed to start payment');
    } finally {
      setIntentLoading(false);
    }
  };

  const handleCancelCheckout = () => {
    setClientSecret(null);
    setPaymentError(null);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto max-w-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 shadow-[0_4px_14px_rgba(22,101,52,0.2)]"
            >
              <svg className="h-12 w-12 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="mt-6 text-2xl font-bold text-stone-900">Thank you for your donation</h1>
            <p className="mt-2 text-stone-600">
              Your support helps fund cleanup drives and keeps our communities green.
            </p>
            <Link
              to="/donate"
              onClick={() => setSuccess(false)}
              className="mt-8 inline-block rounded-2xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Donate again
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Main donate flow ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex flex-1 pt-16">
        <div className="mx-auto w-full max-w-2xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-10"
          >
            {/* Hero / trust block */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-white to-stone-50 p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-10">
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Support cleanup drives
              </h1>
              <p className="mt-3 text-lg text-stone-600">
                Your donation funds supplies, equipment, and logistics so volunteers can make a real impact.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secure payment
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Powered by Stripe
                </span>
              </div>
            </div>

            {drivesLoading && (
              <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-stone-100" />
              </div>
            )}
            {drivesError && (
              <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-800">
                Could not load drives. Please try again later.
              </div>
            )}

            {!drivesLoading && !drivesError && donatableDrives.length === 0 && (
              <Card className="p-8 text-center">
                <p className="font-medium text-stone-700">No drives accepting donations right now.</p>
                <p className="mt-1 text-sm text-stone-500">Check back soon or browse upcoming drives.</p>
                <Link to="/drives" className="mt-4 inline-block text-primary-700 font-medium hover:underline">
                  View drives
                </Link>
              </Card>
            )}

            {!drivesLoading && !drivesError && donatableDrives.length > 0 && (
              <>
                {/* Drive selector + progress bar */}
                <Card className="p-6">
                  <label className="block text-sm font-semibold text-stone-700">Choose a drive</label>
                  <select
                    value={selectedDriveId ?? ''}
                    onChange={(e) => setSelectedDriveId(e.target.value || null)}
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {donatableDrives.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.title} — {new Date(d.date).toLocaleDateString('en-IN')}
                      </option>
                    ))}
                  </select>
                  {selectedDrive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4"
                    >
                      <FundingProgressBar drive={selectedDrive} />
                    </motion.div>
                  )}
                </Card>

                {/* Amount selector */}
                <Card className="p-6">
                  <p className="text-sm font-semibold text-stone-700">Select amount (₹)</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PRESET_AMOUNTS_RUPEE.map((rupee) => (
                      <motion.button
                        key={rupee}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setCustomAmount('');
                          setAmountRupee(rupee);
                        }}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                          !customAmount && amountRupee === rupee
                            ? 'bg-primary-700 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        ₹{rupee.toLocaleString('en-IN')}
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label htmlFor="custom-amount" className="block text-sm font-medium text-stone-600">
                      Or enter custom amount (min ₹10)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-stone-500">₹</span>
                      <input
                        id="custom-amount"
                        type="number"
                        min="10"
                        step="1"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {customAmount.trim() && effectiveAmountRupee < 10 && (
                      <p className="mt-1 text-sm text-amber-700">Minimum donation is ₹10</p>
                    )}
                  </div>
                </Card>

                {/* Payment: Stripe or CTA */}
                <AnimatePresence mode="wait">
                  {clientSecret && stripePromise && selectedDrive ? (
                    <motion.div
                      key="stripe"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="overflow-hidden"
                    >
                      <Card className="p-6">
                        <h2 className="text-lg font-semibold text-stone-900">Complete payment</h2>
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: { colorPrimary: '#15803d', borderRadius: '12px' },
                            },
                          }}
                        >
                          <CheckoutForm
                            clientSecret={clientSecret}
                            amountRupee={effectiveAmountRupee}
                            driveTitle={selectedDrive.title}
                            onSuccess={() => {}}
                            onCancel={handleCancelCheckout}
                          />
                        </Elements>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cta"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {paymentError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                          role="alert"
                        >
                          {paymentError}
                        </motion.div>
                      )}
                      {!isAuthenticated ? (
                        <Card className="p-6 text-center">
                          <p className="font-medium text-stone-700">Log in to donate</p>
                          <p className="mt-1 text-sm text-stone-500">You need an account to complete your donation.</p>
                          <Link
                            to={`/login?redirect=${encodeURIComponent('/donate')}`}
                            className="mt-4 inline-block rounded-2xl bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
                          >
                            Log in
                          </Link>
                        </Card>
                      ) : (
                        <>
                          {!stripePromise && (
                            <p className="mb-3 text-center text-sm text-amber-700">
                              Payment is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY to enable donations.
                            </p>
                          )}
                          <PrimaryButton
                            onClick={handleStartCheckout}
                            disabled={!isValidAmount || intentLoading || !stripePromise}
                            isLoading={intentLoading}
                            className="w-full py-3.5 text-base"
                          >
                            Donate ₹{effectiveAmountRupee.toLocaleString('en-IN')}
                          </PrimaryButton>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
