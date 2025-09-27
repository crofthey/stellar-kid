import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChartStore } from '@/stores/chartStore';
import { getNextWeek, getPreviousWeek, getWeekRangeLabel } from '@/lib/dateUtils';
export function WeekNavigator() {
  const currentDate = useChartStore((s) => s.currentDate);
  const setDate = useChartStore((s) => s.setDate);
  const isLoading = useChartStore((s) => s.isLoading);
  const handlePrevious = () => {
    setDate(getPreviousWeek(currentDate));
  };
  const handleNext = () => {
    setDate(getNextWeek(currentDate));
  };
  return (
    <div className="flex items-center justify-center space-x-4">
      <Button variant="outline" size="icon" onClick={handlePrevious} disabled={isLoading} aria-label="Previous week">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-xl md:text-2xl font-semibold text-center w-64 md:w-80 tabular-nums">
        {getWeekRangeLabel(currentDate)}
      </h2>
      <Button variant="outline" size="icon" onClick={handleNext} disabled={isLoading} aria-label="Next week">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}