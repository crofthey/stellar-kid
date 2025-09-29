import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Star, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SlotState } from '@shared/types';
interface TimeSlotProps {
  label: string;
  state: SlotState;
  slotIndex: number;
  onClick: (slotIndex: number, currentState: SlotState) => void;
  isUpdating: boolean;
}
const iconVariants: Variants = {
  empty: {
    opacity: 0.85,
    scale: 0.9,
    rotate: 0,
  },
  star: {
    opacity: 1,
    scale: 1,
    rotate: -2,
  },
  cross: {
    opacity: 1,
    scale: 1,
    rotate: 2,
  },
};
const icons: Record<SlotState, React.ReactNode> = {
  empty: <Circle className="h-8 w-8 text-gray-300 dark:text-gray-600" />,
  star: <Star className="h-10 w-10 text-stellar-yellow fill-stellar-yellow" />,
  cross: <X className="h-10 w-10 text-stellar-red" />,
};
function TimeSlotBase({ label, state, slotIndex, onClick, isUpdating }: TimeSlotProps) {
  const handleClick = React.useCallback(() => {
    onClick(slotIndex, state);
  }, [onClick, slotIndex, state]);
  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <button
        onClick={handleClick}
        disabled={isUpdating}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background',
          'hover:bg-accent hover:scale-[1.04] active:scale-[0.98] backdrop-blur-sm',
          isUpdating && 'cursor-not-allowed opacity-50'
        )}
        aria-label={`Set status for ${label}`}
      >
        <motion.div
          variants={iconVariants}
          initial={false}
          animate={state}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="relative flex items-center justify-center"
        >
          {icons[state]}
        </motion.div>
      </button>
    </div>
  );
}

export const TimeSlot = React.memo(TimeSlotBase, (prev, next) => {
  return (
    prev.state === next.state &&
    prev.isUpdating === next.isUpdating &&
    prev.label === next.label &&
    prev.slotIndex === next.slotIndex &&
    prev.onClick === next.onClick
  );
});
TimeSlot.displayName = 'TimeSlot';
