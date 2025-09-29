import React from 'react';
import { format, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { Gift, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSlot } from '@/components/TimeSlot';
import { useChartStore } from '@/stores/chartStore';
import { cn } from '@/lib/utils';
import type { DayState, SlotState } from '@shared/types';
interface DayCardProps {
  date: Date;
  dayIndex: number;
  dayState: DayState;
  isPerfectWeek: boolean;
  prizeMode: 'daily' | 'weekly';
}
const timeSlotLabels = ['Morning', 'Afternoon', 'Evening'];
export function DayCard({ date, dayIndex, dayState, isPerfectWeek, prizeMode }: DayCardProps) {
  const updateSlotState = useChartStore((s) => s.updateSlotState);
  const isUpdating = useChartStore((s) => s.isUpdating);
  const handleSlotChange = React.useCallback(
    (slotIndex: number, currentState: SlotState) => {
      updateSlotState(dayIndex, slotIndex, currentState);
    },
    [dayIndex, updateSlotState]
  );
  const isSunday = dayIndex === 6;
  const isPerfectDay = dayState.every(slot => slot === 'star');
  return (
    <Card className={cn(
      'flex flex-col transition-all duration-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1',
      isToday(date) && 'border-stellar-blue ring-2 ring-stellar-blue/50 shadow-lg bg-stellar-blue/10'
    )}>
      <CardHeader className="p-3 md:p-4 text-center">
        <CardTitle className="text-base md:text-lg font-semibold">
          {format(date, 'EEE')}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{format(date, 'd')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col justify-around space-y-4 p-3 md:p-4">
        {dayState.map((slot, slotIndex) => (
          <TimeSlot
            key={slotIndex}
            label={timeSlotLabels[slotIndex]}
            state={slot}
            slotIndex={slotIndex}
            onClick={handleSlotChange}
            isUpdating={isUpdating[`${dayIndex}-${slotIndex}`] || false}
          />
        ))}
        <div className="flex h-16 items-center justify-center">
          {prizeMode === 'weekly' && isSunday && isPerfectWeek && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <Gift className="h-12 w-12 text-stellar-yellow" />
            </motion.div>
          )}
          {prizeMode === 'daily' && isPerfectDay && (
             <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Medal className="h-10 w-10 text-stellar-yellow" />
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
