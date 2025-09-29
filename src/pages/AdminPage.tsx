import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { AdminStats } from '@shared/types';

const STORAGE_KEY = 'stellar-admin-key';

function formatTimestamp(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

export function AdminPage() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem(STORAGE_KEY) ?? '');
  const [inputKey, setInputKey] = useState(adminKey);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [processingFeedbackId, setProcessingFeedbackId] = useState<string | null>(null);
  const [feedbackActionMessage, setFeedbackActionMessage] = useState<string | null>(null);

  const hasAccess = useMemo(() => stats !== null, [stats]);

  const fetchStats = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'Invalid admin key.' : `Request failed (${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Unexpected response.');
      }
      setStats(json.data as AdminStats);
      sessionStorage.setItem(STORAGE_KEY, adminKey);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to fetch stats.');
      setStats(null);
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey) return;
    fetchStats();
  }, [adminKey, fetchStats, refreshCounter]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputKey.trim()) {
      setError('Please enter an admin key.');
      return;
    }
    setAdminKey(inputKey.trim());
  };

  const handleLogout = () => {
    setStats(null);
    setAdminKey('');
    setInputKey('');
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleResolveRequest = async (requestId: string) => {
    const newPassword = (resetPasswords[requestId] || '').trim();
    if (newPassword.length < 6) {
      setRequestFeedback('New password must be at least 6 characters long.');
      return;
    }
    setProcessingRequest(requestId);
    setRequestFeedback(null);
    try {
      const res = await fetch(`/api/admin/reset-requests/${requestId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setResetPasswords(prev => ({ ...prev, [requestId]: '' }));
      setRequestFeedback('Password updated successfully.');
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setRequestFeedback(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleMarkFeedbackRead = async (feedbackId: string) => {
    if (!adminKey) return;
    setProcessingFeedbackId(feedbackId);
    setFeedbackActionMessage(null);
    try {
      const res = await fetch(`/api/admin/feedback/${feedbackId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setFeedbackActionMessage('Marked feedback as read.');
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setFeedbackActionMessage(err instanceof Error ? err.message : 'Unable to update feedback.');
    } finally {
      setProcessingFeedbackId(null);
    }
  };

  return (
    <main className="min-h-screen bg-muted/20 text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Administrator Console</h1>
            <p className="text-sm text-muted-foreground">Private operational metrics for Stellar Kid.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>Back to home</Button>
        </div>
        {!hasAccess && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="admin-key">Admin key</label>
                  <Input
                    id="admin-key"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter secure key"
                    autoComplete="off"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Verifying…' : 'Unlock Console'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {hasAccess && stats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Usage Overview</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Last refresh: {new Date().toLocaleTimeString()}</Badge>
                <Button size="sm" variant="outline" disabled={loading} onClick={() => setRefreshCounter(prev => prev + 1)}>
                  Refresh
                </Button>
                <Button size="sm" variant="ghost" onClick={handleLogout}>Lock Console</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Total Parent Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stats.totalAccounts}</p>
                  <p className="text-sm text-muted-foreground">Children linked: {stats.totalChildren}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Chart Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stats.totalSlotUpdates}</p>
                  <p className="text-sm text-muted-foreground">Total slot updates recorded</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Last Interacted</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formatTimestamp(stats.lastInteractionAt)}</p>
                  <p className="text-sm text-muted-foreground">Most recent chart update</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Last Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formatTimestamp(stats.lastLoginAt)}</p>
                  <p className="text-sm text-muted-foreground">{stats.lastLoginEmail ?? '—'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Logins Recorded</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stats.totalLogins}</p>
                  <p className="text-sm text-muted-foreground">Lifetime login events</p>
                </CardContent>
              </Card>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Parent Accounts</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Last login</th>
                      <th className="py-2 pr-4">Last interaction</th>
                      <th className="py-2 pr-4">Logins</th>
                      <th className="py-2 pr-4">Children</th>
                      <th className="py-2 pr-4">Prize targets</th>
                      <th className="py-2 pr-4">Chart interactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.accounts.map(account => (
                      <tr key={account.email} className="border-t">
                        <td className="py-2 pr-4 font-medium">{account.email}</td>
                        <td className="py-2 pr-4">{formatTimestamp(account.lastLoginAt)}</td>
                        <td className="py-2 pr-4">{formatTimestamp(account.lastInteractionAt)}</td>
                        <td className="py-2 pr-4">{account.loginCount}</td>
                        <td className="py-2 pr-4">{account.childCount}</td>
                        <td className="py-2 pr-4">{account.totalPrizeTargets}</td>
                        <td className="py-2 pr-4">{account.totalSlotUpdates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Feedback Messages</h3>
                <Badge variant="outline">{stats.feedbackMessages.filter(f => f.status === 'new').length} new</Badge>
              </div>
              {feedbackActionMessage && <p className="text-sm text-muted-foreground">{feedbackActionMessage}</p>}
              <div className="space-y-3">
                {stats.feedbackMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No feedback received yet.</p>
                )}
                {stats.feedbackMessages.map((feedback) => (
                  <Card key={feedback.id} className={feedback.status === 'read' ? 'opacity-70' : ''}>
                    <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-base">{feedback.email}</CardTitle>
                        <p className="text-xs text-muted-foreground">Sent {formatTimestamp(feedback.createdAt)}</p>
                      </div>
                      <Badge variant={feedback.status === 'new' ? 'secondary' : 'outline'} className="capitalize">
                        {feedback.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm whitespace-pre-wrap break-words">{feedback.message}</p>
                      {feedback.status === 'read' && feedback.resolvedAt && (
                        <p className="text-xs text-muted-foreground">Reviewed {formatTimestamp(feedback.resolvedAt)}</p>
                      )}
                      {feedback.status === 'new' && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkFeedbackRead(feedback.id)}
                            disabled={processingFeedbackId === feedback.id || loading}
                          >
                            {processingFeedbackId === feedback.id ? 'Marking…' : 'Mark as read'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Password Reset Requests</h3>
                <Badge variant="outline">{stats.resetRequests.filter(r => r.status === 'pending').length} pending</Badge>
              </div>
              {requestFeedback && <p className="text-sm text-muted-foreground">{requestFeedback}</p>}
              <div className="space-y-3">
                {stats.resetRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground">No password reset requests recorded.</p>
                )}
                {stats.resetRequests.map((request) => (
                  <Card key={request.id} className={request.status === 'completed' ? 'opacity-70' : ''}>
                    <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-base">{request.email}</CardTitle>
                        <p className="text-xs text-muted-foreground">Requested {formatTimestamp(request.createdAt)}</p>
                      </div>
                      <Badge variant={request.status === 'pending' ? 'secondary' : 'outline'} className="capitalize">
                        {request.status}
                      </Badge>
                    </CardHeader>
                    {request.status === 'pending' && (
                      <CardContent className="space-y-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium" htmlFor={`new-password-${request.id}`}>New password</label>
                          <Input
                            id={`new-password-${request.id}`}
                            type="password"
                            value={resetPasswords[request.id] || ''}
                            onChange={(e) => setResetPasswords(prev => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder="Min 6 characters"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolveRequest(request.id)}
                            disabled={processingRequest === request.id || loading}
                          >
                            {processingRequest === request.id ? 'Updating…' : 'Set Password'}
                          </Button>
                        </div>
                      </CardContent>
                    )}
                    {request.status === 'completed' && request.resolvedAt && (
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Resolved {formatTimestamp(request.resolvedAt)}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this page secure. Rotate the admin key regularly and avoid storing it on shared devices.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
