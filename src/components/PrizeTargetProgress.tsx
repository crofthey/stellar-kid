import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChartStore } from '@/stores/chartStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, CalendarDays } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
export function PrizeTargetProgress() {
  const { selectedChild } = useChartStore(
    useShallow(state => ({
      selectedChild: state.selectedChild,
    }))
  );
  const nextTarget = useMemo(() => {
    if (!selectedChild?.prizeTargets) return null;
    return selectedChild.prizeTargets
      .filter(t => !t.isAchieved)
      .sort((a, b) => a.targetCount - b.targetCount)[0] || null;
  }, [selectedChild]);
  if (!nextTarget) {
    return null;
  }
  const currentProgress = nextTarget.type === 'stars' ? selectedChild?.totalStars || 0 : selectedChild?.totalPerfectDays || 0;
  const progressPercentage = Math.min((currentProgress / nextTarget.targetCount) * 100, 100);
  const Icon = nextTarget.type === 'stars' ? Star : CalendarDays;
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
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}