import React from 'react';
import { Settings, Moon, Paintbrush, CalendarDays, CalendarRange, RotateCcw, AlertTriangle, Trophy } from 'lucide-react';
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
import { useTheme } from '@/hooks/use-theme';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { useChartStore } from '@/stores/chartStore';
import { cn } from '@/lib/utils';
import { PrizeTargetManager } from './PrizeTargetManager';
export function SettingsMenu() {
  const { isDark, toggleTheme } = useTheme();
  const { activeTheme, setTheme, themes } = useChartTheme();
  const { selectedChild, updateChildSettings, resetCurrentWeek } = useChartStore(
    useShallow((state) => ({
      selectedChild: state.selectedChild,
      updateChildSettings: state.updateChildSettings,
      resetCurrentWeek: state.resetCurrentWeek,
    }))
  );
  const handlePrizeModeChange = (value: 'daily' | 'weekly') => {
    if (value && selectedChild && value !== selectedChild.prizeMode) {
      updateChildSettings({ prizeMode: value });
    }
  };
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
              Reset This Week
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently reset all stars and crosses for the current week. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetCurrentWeek()}>
                Yes, reset week
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PopoverContent>
    </Popover>
  );
}