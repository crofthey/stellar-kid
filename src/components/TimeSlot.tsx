import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Star, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SlotState } from '@shared/types';
interface TimeSlotProps {
  label: string;
  state: SlotState;
  onClick: () => void;
  isUpdating: boolean;
}
const iconVariants: Variants = {
  hidden: { scale: 0, opacity: 0, rotate: -90 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
  exit: {
    scale: 0,
    opacity: 0,
    rotate: 90,
    transition: { duration: 0.15 }
  }
};
const icons: Record<SlotState, React.ReactNode> = {
  empty: <Circle className="h-8 w-8 text-gray-300 dark:text-gray-600" />,
  star: <Star className="h-10 w-10 text-stellar-yellow fill-stellar-yellow" />,
  cross: <X className="h-10 w-10 text-stellar-red" />,
};
export function TimeSlot({ label, state, onClick, isUpdating }: TimeSlotProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <button
        onClick={onClick}
        disabled={isUpdating}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background',
          'hover:bg-accent hover:scale-105 active:scale-95',
          isUpdating && 'cursor-not-allowed opacity-50'
        )}
        aria-label={`Set status for ${label}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={iconVariants}
          >
            {icons[state]}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}