import React, { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useChartStore } from '@/stores/chartStore';
import { getWeekDays } from '@/lib/dateUtils';
import { WeekNavigator } from '@/components/WeekNavigator';
import { DayCard } from '@/components/DayCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EditableChildName } from '@/components/EditableChildName';
import { PrizeBox } from '@/components/PrizeBox';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PrizeTargetProgress } from '@/components/PrizeTargetProgress';
import { WALLPAPER_LOOKUP } from '@/config/wallpapers';
import { AddToHomeBanner } from '@/components/AddToHomeBanner';
function ChartGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Card key={i} className="rounded-2xl">
          <CardHeader className="p-3 md:p-4 text-center">
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-around space-y-4 p-3 md:p-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex flex-col items-center space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export function ChartPage() {
  useChartTheme();
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore(
    useShallow(state => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    }))
  );
  const {
    selectedChild,
    currentDate,
    weekData,
    isLoading,
    fetchWeekData,
    selectChild,
    fetchChildren,
    children,
    clearSelection,
  } = useChartStore(
    useShallow((state) => ({
      selectedChild: state.selectedChild,
      currentDate: state.currentDate,
      weekData: state.weekData,
      isLoading: state.isLoading,
      fetchWeekData: state.fetchWeekData,
      selectChild: state.selectChild,
      fetchChildren: state.fetchChildren,
      children: state.children,
      clearSelection: state.clearSelection,
    }))
  );
  const selectedChildId = selectedChild?.id;
  const fetchDebugRef = useRef<{ childId: string | null; dateKey: string | null }>({ childId: null, dateKey: null });
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);
  useEffect(() => {
    if (isAuthenticated && children.length === 0) {
      fetchChildren();
    }
  }, [isAuthenticated, children, fetchChildren]);
  useEffect(() => {
    if (!childId) return;
    if (!selectedChild || selectedChild.id !== childId) {
      selectChild(childId);
    }
  }, [childId, selectedChild?.id, selectChild]);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);
  useEffect(() => {
    if (!selectedChildId) return;
    const dateKey = currentDate.toDateString();
    const prev = fetchDebugRef.current;
    const reasons: string[] = [];
    if (prev.childId !== selectedChildId) reasons.push('child changed');
    if (prev.dateKey !== dateKey) reasons.push('date changed');
    fetchDebugRef.current = { childId: selectedChildId, dateKey };
    if (import.meta.env.DEV) {
      console.log('[ChartPage] fetching week data', {
        childId: selectedChildId,
        dateKey,
        reasons: reasons.length ? reasons : ['initial mount'],
      });
    }
    fetchWeekData(currentDate, selectedChildId);
  }, [fetchWeekData, currentDate, selectedChildId]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[ChartPage] loading state changed', {
      isLoading,
      hasWeekData: !!weekData,
    });
  }, [isLoading, weekData]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const isPerfectWeek = useMemo(() => {
    if (!weekData) return false;
    const allSlots = Object.values(weekData).flat();
    return allSlots.length === 21 && allSlots.every((slot) => slot === 'star');
  }, [weekData]);
  if (!isInitialized || !selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-stellar-blue" />
      </div>
    );
  }
  const backgroundPattern = selectedChild.backgroundPattern ?? 'confetti';
  const wallpaper = WALLPAPER_LOOKUP[backgroundPattern];
  const tileStyle = {
    backgroundSize: wallpaper.tileSize,
    ['--wallpaper-light' as const]: `url('${wallpaper.lightPattern}')`,
    ['--wallpaper-dark' as const]: `url('${wallpaper.darkPattern}')`,
  } satisfies React.CSSProperties;
  const overlayStyle = {
    ['--overlay-light' as const]: wallpaper.lightOverlay,
    ['--overlay-dark' as const]: wallpaper.darkOverlay,
  } satisfies React.CSSProperties;
  const radialStyle = {
    ['--radial-light' as const]: wallpaper.lightRadial,
    ['--radial-dark' as const]: wallpaper.darkRadial,
  } satisfies React.CSSProperties;
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-foreground relative transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none -z-0">
        <div
          className="absolute inset-0 bg-[image:var(--wallpaper-light)] dark:bg-[image:var(--wallpaper-dark)] bg-repeat"
          style={tileStyle}
        />
        <div
          className="absolute inset-0 bg-[image:var(--overlay-light)] dark:bg-[image:var(--overlay-dark)]"
          style={overlayStyle}
        />
        <div
          className="absolute inset-0 bg-[image:var(--radial-light)] dark:bg-[image:var(--radial-dark)]"
          style={radialStyle}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 mb-4">
          <div className="w-full sm:w-auto flex-shrink-0 order-2 sm:order-1">
            <PrizeBox />
          </div>
          <div className="text-center w-full sm:w-auto flex-grow order-1 sm:order-2">
            <EditableChildName />
          </div>
          <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 order-3">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SettingsMenu />
          </div>
        </header>
        <div className="mb-8">
            <PrizeTargetProgress />
        </div>
        <div className="mb-8">
          <WeekNavigator />
        </div>
        {isLoading || !weekData ? (
          <ChartGridSkeleton />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
            {weekDays.map((date, index) => {
              const dayState = weekData[index] || ['empty', 'empty', 'empty'];
              return (
                <DayCard
                  key={date.toISOString()}
                  date={date}
                  dayIndex={index}
                  dayState={dayState}
                  isPerfectWeek={isPerfectWeek}
                  prizeMode={selectedChild.prizeMode}
                />
              );
            })}
          </div>
        )}
      </div>
      <Toaster richColors closeButton />
      <AddToHomeBanner />
    </main>
  );
}
