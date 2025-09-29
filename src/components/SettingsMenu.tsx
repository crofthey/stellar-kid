import React from 'react';
import { Settings, Moon, Paintbrush, CalendarDays, CalendarRange, RotateCcw, AlertTriangle, Trophy, Image } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTheme } from '@/hooks/use-theme';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useChartStore } from '@/stores/chartStore';
import { cn } from '@/lib/utils';
import { PrizeTargetManager } from './PrizeTargetManager';
import { WALLPAPER_OPTIONS } from '@/config/wallpapers';
import type { BackgroundPattern } from '@shared/types';
export function SettingsMenu() {
  const { isDark, toggleTheme } = useTheme();
  const { activeTheme, setTheme, themes } = useChartTheme();
  const { selectedChild, updateChildSettings, resetChart } = useChartStore(
    useShallow((state) => ({
      selectedChild: state.selectedChild,
      updateChildSettings: state.updateChildSettings,
      resetChart: state.resetChart,
    }))
  );
  const [isBackgroundDialogOpen, setBackgroundDialogOpen] = React.useState(false);
  const handlePrizeModeChange = (value: 'daily' | 'weekly') => {
    if (value && selectedChild && value !== selectedChild.prizeMode) {
      updateChildSettings({ prizeMode: value });
    }
  };
  const handleBackgroundChange = (value: BackgroundPattern) => {
    if (!selectedChild || value === (selectedChild.backgroundPattern ?? 'confetti')) return;
    updateChildSettings({ backgroundPattern: value });
    setBackgroundDialogOpen(false);
  };
  const currentBackground = selectedChild.backgroundPattern ?? 'confetti';
  const currentWallpaper = WALLPAPER_OPTIONS.find((option) => option.id === currentBackground);
  const previewStyle = currentWallpaper
    ? ({
        backgroundSize: currentWallpaper.tileSize,
        ['--preview-light' as const]: `url('${currentWallpaper.lightPattern}')`,
        ['--preview-dark' as const]: `url('${currentWallpaper.darkPattern}')`,
      } satisfies React.CSSProperties)
    : undefined;
  if (!selectedChild) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Settings</h4>
          <p className="text-sm text-muted-foreground">Customize your chart's appearance and rewards.</p>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </Label>
          <Switch id="dark-mode" checked={isDark} onCheckedChange={toggleTheme} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            <span>Theme</span>
          </Label>
          <div className="grid grid-cols-5 gap-2 pt-1">
            {themes.map((theme) => {
              const isActive = activeTheme.name === theme.name;
              return (
                <button
                  key={theme.name}
                  onClick={() => setTheme(theme.name)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all',
                    isActive ? 'border-primary ring-2 ring-ring ring-offset-2 ring-offset-background' : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  style={{ backgroundColor: `hsl(${theme.colors['--stellar-blue']})` }}
                  aria-label={`Select ${theme.name} theme`}
                />
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>Background</span>
          </Label>
          <Dialog open={isBackgroundDialogOpen} onOpenChange={setBackgroundDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <div
                  className="h-10 w-10 rounded-lg border border-border/60 bg-[image:var(--preview-light)] dark:bg-[image:var(--preview-dark)] bg-repeat"
                  style={previewStyle}
                />
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {currentWallpaper ? currentWallpaper.name : 'Choose background'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tap to explore wallpaper choices
                  </p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose a Background</DialogTitle>
                <DialogDescription>
                  Each child can pick their own wallpaper. Changes apply right away.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {WALLPAPER_OPTIONS.map((option) => {
                  const isActive = option.id === currentBackground;
                  const style = {
                    backgroundSize: option.tileSize,
                    ['--preview-light' as const]: `url('${option.lightPattern}')`,
                    ['--preview-dark' as const]: `url('${option.darkPattern}')`,
                  } satisfies React.CSSProperties;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleBackgroundChange(option.id)}
                      className={cn(
                        'relative overflow-hidden rounded-xl border border-border/60 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        isActive ? `ring-2 ring-offset-2 ring-offset-background ${option.accentClass}` : 'hover:border-primary/40'
                      )}
                      aria-pressed={isActive}
                    >
                      <div
                        className="absolute inset-0 bg-[image:var(--preview-light)] dark:bg-[image:var(--preview-dark)] bg-repeat"
                        style={style}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-gray-900/70 dark:via-gray-900/40 dark:to-transparent" />
                      <div className="relative z-10 p-4">
                        <p className="text-sm font-semibold">{option.name}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Prize Mode</span>
          </Label>
          <ToggleGroup
            type="single"
            value={selectedChild.prizeMode}
            onValueChange={handlePrizeModeChange}
            className="w-full grid grid-cols-2"
          >
            <ToggleGroupItem value="daily" aria-label="Daily prizes">
              <CalendarDays className="h-4 w-4 mr-2" />
              Daily
            </ToggleGroupItem>
            <ToggleGroupItem value="weekly" aria-label="Weekly prizes">
              <CalendarRange className="h-4 w-4 mr-2" />
              Weekly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Separator />
        <PrizeTargetManager>
            <Button variant="outline" className="w-full">
                <Trophy className="h-4 w-4 mr-2" />
                Manage Prize Targets
            </Button>
        </PrizeTargetManager>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Chart
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently clear every star from the chart and reset the prize box. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetChart()}>
                Yes, reset chart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PopoverContent>
    </Popover>
  );
}
