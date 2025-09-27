import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Star } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await forgotPassword(email);
    if (result.success && result.resetToken) {
      // In a real app, the user would get an email. Here we navigate them with the token.
      navigate(`/reset-password?token=${result.resetToken}`);
    }
  };
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--stellar-blue)/0.1)_1px,_transparent_0)] [background-size:20px_20px]"></div>
      <div className="relative z-10 flex flex-col items-center space-y-4 text-center mb-8">
        <Link to="/auth" className="flex items-center gap-3 text-5xl font-display font-bold text-stellar-blue">
          <Star className="h-10 w-10" />
          <h1>StellarKid</h1>
        </Link>
      </div>
      <Card className="w-full max-w-md relative z-10">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset token.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardContent className="flex flex-col items-center gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Token
            </Button>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
              Back to Login
            </Link>
          </CardContent>
        </form>
      </Card>
      <Toaster richColors closeButton />
    </main>
  );
}