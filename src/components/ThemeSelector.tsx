import React from 'react';
import { Paintbrush, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { cn } from '@/lib/utils';
export function ThemeSelector() {
  const { activeTheme, setTheme, themes } = useChartTheme();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Paintbrush className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-2">
          {themes.map((theme) => {
            const isActive = activeTheme.name === theme.name;
            return (
              <button
                key={theme.name}
                onClick={() => setTheme(theme.name)}
                className={cn(
                  'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all',
                  isActive ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                )}
                style={{ backgroundColor: `hsl(${theme.colors['--stellar-blue']})` }}
                aria-label={`Select ${theme.name} theme`}
              >
                {isActive && <Check className="h-5 w-5 text-white mix-blend-difference" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}