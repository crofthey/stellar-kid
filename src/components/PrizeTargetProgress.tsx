import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChartStore } from '@/stores/chartStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, CalendarDays, CalendarRange } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
export function PrizeTargetProgress() {
  const { selectedChild } = useChartStore(
    useShallow(state => ({
      selectedChild: state.selectedChild,
    }))
  );
  const nextTarget = useMemo(() => {
    if (!selectedChild?.prizeTargets) return null;
    return selectedChild.prizeTargets.find(target => !target.isAchieved) ?? null;
  }, [selectedChild?.prizeTargets]);
  const spentTotals = useMemo(() => {
    if (!selectedChild) {
      return { stars: 0, days: 0, weeks: 0 } as const;
    }
    const fromTargets = selectedChild.prizeTargets?.reduce(
      (totals, target) => {
        if (!target.isAchieved) return totals;
        if (target.type === 'stars') totals.stars += target.targetCount;
        else if (target.type === 'days') totals.days += target.targetCount;
        else totals.weeks += target.targetCount;
        return totals;
      },
      { stars: 0, days: 0, weeks: 0 }
    ) ?? { stars: 0, days: 0, weeks: 0 };
    return {
      stars: selectedChild.spentStars ?? fromTargets.stars,
      days: selectedChild.spentPerfectDays ?? fromTargets.days,
      weeks: selectedChild.spentPerfectWeeks ?? fromTargets.weeks,
    } as const;
  }, [selectedChild]);
  if (!nextTarget) {
    return null;
  }
  const availableByType = {
    stars: Math.max(0, (selectedChild?.totalStars ?? 0) - spentTotals.stars),
    days: Math.max(0, (selectedChild?.totalPerfectDays ?? 0) - spentTotals.days),
    weeks: Math.max(0, (selectedChild?.totalPerfectWeeks ?? 0) - spentTotals.weeks),
  } as const;
  const currentProgress = Math.min(availableByType[nextTarget.type], nextTarget.targetCount);
  const progressPercentage = Math.min((currentProgress / nextTarget.targetCount) * 100, 100);
  const Icon = nextTarget.type === 'stars' ? Star : nextTarget.type === 'days' ? CalendarDays : CalendarRange;
  const unitLabel = nextTarget.type === 'stars' ? 'stars' : nextTarget.type === 'days' ? 'perfect days' : 'perfect weeks';
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-md mx-auto"
      >
        <Card className="bg-background/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Next Prize: {nextTarget.name}
            </CardTitle>
            <div className="text-sm font-bold flex items-center gap-1">
              <motion.span
                key={currentProgress}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {currentProgress}
              </motion.span>
              <span>/ {nextTarget.targetCount}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground capitalize">Target: {unitLabel}</p>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
