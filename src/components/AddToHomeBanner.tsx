import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBeforeInstallPrompt } from '@/hooks/use-before-install-prompt';

const STORAGE_KEY = 'stellar-add-to-home-dismissed';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function AddToHomeBanner() {
  const { deferredPrompt, promptInstall, setDeferredPrompt } = useBeforeInstallPrompt();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
    if (!deferredPrompt || dismissed || !isAndroid() || isStandalone()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [deferredPrompt]);

  const handleDismiss = React.useCallback(() => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setDeferredPrompt(null);
  }, [setDeferredPrompt]);

  const handleInstall = React.useCallback(async () => {
    const choice = await promptInstall();
    if (choice.outcome === 'accepted') {
      setVisible(false);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, '1');
      }
    }
  }, [promptInstall]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <Card className="pointer-events-auto max-w-sm w-full bg-background/95 shadow-lg border border-primary/30">
        <div className="p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">Add Stellar Kid to your home screen</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap below to keep the chart just a tap away. No installation required.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Maybe later
            </Button>
            <Button size="sm" onClick={handleInstall}>
              Add to Home Screen
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
