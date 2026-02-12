import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

/** Root application component with router shell. */
export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
              <h1 className="text-4xl font-bold text-gray-900">CleanupCrew</h1>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
