import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { AuthResponse, UserResponse } from '@shared/types';
const TOKEN_KEY = 'stellar-kid-token';
type AuthState = {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
};
type AuthActions = {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: UserResponse) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; resetToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
};
export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Start as true to handle initial user fetch
    isInitialized: false,
    initialize: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const user = await api<UserResponse>('/api/users/me');
          set({ user, token, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
      set({ isLoading: false, isInitialized: true });
    },
    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const response = await api<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_KEY, response.token);
        set({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false });
        toast.success('Welcome back!');
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        set({ isLoading: false });
        return { success: false, message: errorMessage };
      }
    },
    register: async (email, password) => {
      set({ isLoading: true });
      try {
        const response = await api<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_KEY, response.token);
        set({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false });
        toast.success('Account created successfully!');
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        toast.error(errorMessage);
        set({ isLoading: false });
        return false;
      }
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, isAuthenticated: false });
      window.location.href = '/auth';
    },
    setUser: (user) => {
      set({ user });
    },
    forgotPassword: async (email) => {
      set({ isLoading: true });
      try {
        const response = await api<{ resetToken?: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        toast.success('If an account with that email exists, a reset token has been generated.');
        set({ isLoading: false });
        return { success: true, resetToken: response.resetToken };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Request failed';
        toast.error(errorMessage);
        set({ isLoading: false });
        return { success: false };
      }
    },
    resetPassword: async (token, password) => {
      set({ isLoading: true });
      try {
        await api('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, password }),
        });
        toast.success('Password has been reset successfully! Please log in.');
        set({ isLoading: false });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Reset failed';
        toast.error(errorMessage);
        set({ isLoading: false });
        return false;
      }
    },
  }))
);
// Initialize auth state on app load
useAuthStore.getState().initialize();