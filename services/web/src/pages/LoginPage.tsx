import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { PrimaryButton } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

export function LoginPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password,
      });
      setTokens(res.data.accessToken, res.data.refreshToken);
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Login failed';
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-stone-900">Log in</h1>
            <p className="mt-1 text-stone-600">Access your CleanupCrew account</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <PrimaryButton type="submit" isLoading={loading} className="w-full">
                Log in
              </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-stone-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-primary-700 hover:text-primary-800">
                Register
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
