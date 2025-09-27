import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore(
    useShallow(state => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      isLoading: state.isLoading,
    }))
  );
  useEffect(() => {
    // Wait until the initial auth check is complete before navigating
    if (isInitialized && !isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [isAuthenticated, isInitialized, isLoading, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-stellar-blue" />
    </div>
  );
}