import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useChartStore } from '@/stores/chartStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Star, LogOut, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { ChildListItem } from '@/components/ChildListItem';
export function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, logout, isLoading: isAuthLoading } = useAuthStore(
    useShallow(state => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      logout: state.logout,
      isLoading: state.isLoading,
    }))
  );
  const { children, fetchChildren, createChild, isFetchingChildren } = useChartStore(
    useShallow(state => ({
      children: state.children,
      fetchChildren: state.fetchChildren,
      createChild: state.createChild,
      isFetchingChildren: state.isFetchingChildren,
    }))
  );
  const [newChildName, setNewChildName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);
  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated, fetchChildren]);
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newChildName.trim() && !isCreating) {
      setIsCreating(true);
      await createChild(newChildName.trim());
      setNewChildName('');
      setIsCreating(false);
    }
  };
  if (!isInitialized || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-stellar-blue" />
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-3xl font-display font-bold text-stellar-blue">
            <Star className="h-8 w-8" />
            <h1>StellarKid Dashboard</h1>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Are you sure you want to log out?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will be returned to the login screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={logout}>
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add a New Child</CardTitle>
              <CardDescription>Create a new chart for a child.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChild} className="flex gap-2">
                <Input
                  placeholder="Child's Name"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  disabled={isCreating}
                />
                <Button type="submit" disabled={!newChildName.trim() || isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Select a Chart</CardTitle>
              <CardDescription>Choose a child to view their behavior chart.</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingChildren ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-stellar-blue" />
                </div>
              ) : children.length > 0 ? (
                <div className="space-y-3">
                  {children.map(child => (
                    <ChildListItem key={child.id} child={child} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No children added yet. Add one to get started!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster richColors closeButton />
    </main>
  );
}