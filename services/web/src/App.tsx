import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { ProtectedRoute, AdminRoute } from './components/auth';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { ReportSubmissionPage } from './pages/ReportSubmissionPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DrivesPage } from './pages/DrivesPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DonatePage } from './pages/DonatePage';
import { LeaderboardPage } from './pages/LeaderboardPage';

/** Placeholder for future pages - keeps nav links from 404ing */
function PlaceholderPage({ title }: { title: string }): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <h1 className="text-2xl font-semibold text-stone-600">{title} — Coming soon</h1>
    </div>
  );
}

/** Root application component with router shell. */
export function App(): React.ReactElement {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/drives" element={<DrivesPage />} />
          <Route path="/drives/:id" element={<PlaceholderPage title="Drive Details" />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reports/new" element={<ReportSubmissionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
