import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PrimaryButton } from '../components/ui';
import { api } from '../lib/api';

export function RegisterPage(): React.ReactElement {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password, name });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Registration failed';
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <h1 className="text-xl font-bold text-stone-900">Check your email</h1>
            <p className="mt-2 text-stone-600">
              We&apos;ve sent a verification link to your email. Click it to activate your account.
            </p>
            <Link to="/login">
              <PrimaryButton className="mt-6">Go to login</PrimaryButton>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex flex-1 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md px-4 py-16"
        >
          <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
            <p className="mt-1 text-stone-600">Join CleanupCrew to report spots and volunteer</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-stone-500">Minimum 8 characters</p>
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <PrimaryButton type="submit" isLoading={loading} className="w-full">
                Register
              </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
