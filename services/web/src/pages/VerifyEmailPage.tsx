import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PrimaryButton } from '../components/ui';
import { api } from '../lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function VerifyEmailPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing verification link.');
      return;
    }
    let cancelled = false;
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => {
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified. You can now log in.');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error');
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
              : 'Verification failed. The link may have expired.';
          setMessage(typeof msg === 'string' ? msg : 'Verification failed.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex flex-1 items-center justify-center pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          {status === 'loading' && (
            <>
              <p className="text-stone-600">Verifying your email…</p>
              <div className="mt-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto" />
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="text-xl font-bold text-green-700">Email verified</h1>
              <p className="mt-2 text-stone-600">{message}</p>
              <Link to="/login">
                <PrimaryButton className="mt-6">Log in</PrimaryButton>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-xl font-bold text-red-600">Verification failed</h1>
              <p className="mt-2 text-stone-600">{message}</p>
              <Link to="/register">
                <PrimaryButton className="mt-6">Register again</PrimaryButton>
              </Link>
              <span className="mx-2" />
              <Link to="/login">
                <PrimaryButton className="mt-6 border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50">Log in</PrimaryButton>
              </Link>
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
