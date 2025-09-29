import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Gift, User, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Child } from '@shared/types';

interface ChildListItemProps {
  child: Child;
  onDelete: (childId: string) => void;
}

export function ChildListItem({ child, onDelete }: ChildListItemProps) {
  return (
    <Card className="p-4 transition-all duration-200 ease-in-out hover:bg-accent hover:shadow-md hover:border-primary/50">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/child/${child.id}`} className="flex-1 flex items-center gap-3 group">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-base group-hover:text-primary transition-colors">{child.name}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Gift className="h-3 w-3" />
              <span>{child.prizeCount} {child.prizeCount === 1 ? 'prize' : 'prizes'} earned</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {child.name}&rsquo;s chart?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the child and all associated progress. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(child.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
