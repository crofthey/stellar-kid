import React from 'react';
import { Gift } from 'lucide-react';
import { useChartStore } from '@/stores/chartStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
export function PrizeBox() {
  const selectedChild = useChartStore(
    useShallow((state) => state.selectedChild)
  );
  if (!selectedChild) return null;
  return (
    <Card className="bg-background/70 backdrop-blur-sm w-full sm:w-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
        <CardTitle className="text-sm font-medium">Prize Box</CardTitle>
        <Gift className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="text-2xl font-bold flex items-center">
          <motion.span
            key={selectedChild.prizeCount}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {selectedChild.prizeCount}
          </motion.span>
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedChild.prizeMode === 'daily' ? 'Perfect days' : 'Perfect weeks'}
        </p>
      </CardContent>
    </Card>
  );
}
