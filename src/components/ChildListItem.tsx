import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ArrowRight, Gift, User } from 'lucide-react';
import type { Child } from '@shared/types';
interface ChildListItemProps {
  child: Child;
}
export function ChildListItem({ child }: ChildListItemProps) {
  return (
    <Link to={`/child/${child.id}`} className="block group">
      <Card className="p-4 transition-all duration-200 ease-in-out group-hover:bg-accent group-hover:shadow-md group-hover:border-primary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">{child.name}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Gift className="h-3 w-3" />
                <span>{child.prizeCount} {child.prizeCount === 1 ? 'prize' : 'prizes'} earned</span>
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}