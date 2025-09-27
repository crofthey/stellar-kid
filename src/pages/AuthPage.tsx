import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore(
    useShallow(state => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    }))
  );
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--stellar-blue)/0.1)_1px,_transparent_0)] [background-size:20px_20px]"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center gap-3 text-5xl font-display font-bold text-stellar-blue">
          <Star className="h-10 w-10" />
          <h1>StellarKid</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Sign in or create an account to start tracking.
        </p>
      </div>
      <div className="relative z-10 mt-8 w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  );
}