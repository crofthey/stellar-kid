import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChartStore } from '@/stores/chartStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, PlusCircle, Star, CalendarDays, CheckCircle2, Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { PrizeTarget } from '@shared/types';
export function PrizeTargetManager({ children }: { children: React.ReactNode }) {
  const { selectedChild, addPrizeTarget, updatePrizeTarget, deletePrizeTarget } = useChartStore(
    useShallow(state => ({
      selectedChild: state.selectedChild,
      addPrizeTarget: state.addPrizeTarget,
      updatePrizeTarget: state.updatePrizeTarget,
      deletePrizeTarget: state.deletePrizeTarget,
    }))
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingTarget, setEditingTarget] = useState<PrizeTarget | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'stars' | 'days'>('stars');
  const [targetCount, setTargetCount] = useState(10);
  const sortedTargets = useMemo(() => {
    return [...(selectedChild?.prizeTargets || [])].sort((a, b) => (a.isAchieved ? 1 : -1) - (b.isAchieved ? 1 : -1) || (a.achievedAt || 0) - (b.achievedAt || 0));
  }, [selectedChild?.prizeTargets]);
  const handleAddNew = () => {
    setIsAdding(true);
    setEditingTarget(null);
    setName('');
    setType('stars');
    setTargetCount(10);
  };
  const handleEdit = (target: PrizeTarget) => {
    setEditingTarget(target);
    setIsAdding(false);
    setName(target.name);
    setType(target.type);
    setTargetCount(target.targetCount);
  };
  const handleCancel = () => {
    setIsAdding(false);
    setEditingTarget(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetCount <= 0) return;
    if (editingTarget) {
      updatePrizeTarget(editingTarget.id, { name, type, targetCount });
    } else {
      addPrizeTarget({ name, type, targetCount });
    }
    handleCancel();
  };
  if (!selectedChild) return null;
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <h3 className="text-lg font-semibold">{editingTarget ? 'Edit Prize Target' : 'New Prize Target'}</h3>
      <div className="space-y-2">
        <Label htmlFor="prize-name">Prize Name</Label>
        <Input id="prize-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ice Cream Trip" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prize-type">Goal Type</Label>
          <Select value={type} onValueChange={(v: 'stars' | 'days') => setType(v)}>
            <SelectTrigger id="prize-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Total Stars</SelectItem>
              <SelectItem value="days">Perfect Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prize-count">Goal Count</Label>
          <Input id="prize-count" type="number" value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value, 10) || 0)} min="1" required />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
        <Button type="submit">{editingTarget ? 'Save Changes' : 'Add Target'}</Button>
      </div>
    </form>
  );
  return (
    <Dialog onOpenChange={() => { handleCancel(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Manage Prize Targets</DialogTitle>
          <DialogDescription>Set goals for your child to earn special prizes.</DialogDescription>
        </DialogHeader>
        <Separator />
        {isAdding || editingTarget ? renderForm() : (
          <>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2">
                {sortedTargets.length > 0 ? sortedTargets.map(target => (
                  <div key={target.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      {target.isAchieved ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Trophy className="h-5 w-5 text-amber-500" />}
                      <div>
                        <p className={`font-medium ${target.isAchieved ? 'line-through text-muted-foreground' : ''}`}>{target.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {target.targetCount} {target.type === 'stars' ? <Star className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                        </p>
                      </div>
                    </div>
                    {!target.isAchieved && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(target)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Prize Target?</AlertDialogTitle><AlertDialogDescription>This will permanently remove the "{target.name}" prize target. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletePrizeTarget(target.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-center text-sm text-muted-foreground py-8">No prize targets set yet.</p>
                )}
              </div>
            </ScrollArea>
            <Button onClick={handleAddNew} className="w-full mt-4"><PlusCircle className="h-4 w-4 mr-2" />Add New Target</Button>
          </>
        )}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}