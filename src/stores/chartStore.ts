import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { getWeekInfo } from '@/lib/dateUtils';
import type { ChartWeek, SlotState, WeekData, Child, CreateChildResponse, PrizeTarget, UpdateSlotResponse } from '@shared/types';
import { useAuthStore } from './authStore';
type ChartState = {
  children: Child[];
  selectedChild: Child | null;
  currentDate: Date;
  weekData: WeekData | null;
  isLoading: boolean;
  isFetchingChildren: boolean;
  isUpdating: Record<string, boolean>; // key: "day-slot"
};
type ChartActions = {
  fetchChildren: () => Promise<void>;
  selectChild: (childId: string) => void;
  createChild: (name: string) => Promise<void>;
  setDate: (date: Date) => void;
  fetchWeekData: (date: Date, childId: string) => Promise<void>;
  updateSlotState: (dayIndex: number, slotIndex: number, currentState: SlotState) => Promise<void>;
  updateChildSettings: (settings: Partial<Pick<Child, 'name' | 'prizeMode'>>) => Promise<void>;
  incrementPrizes: () => Promise<void>;
  resetCurrentWeek: () => Promise<void>;
  addPrizeTarget: (target: Omit<PrizeTarget, 'id' | 'childId' | 'isAchieved'>) => Promise<void>;
  updatePrizeTarget: (targetId: string, updates: Partial<Omit<PrizeTarget, 'id' | 'childId'>>) => Promise<void>;
  deletePrizeTarget: (targetId: string) => Promise<void>;
  clearSelection: () => void;
  reset: () => void;
};
const getNextState = (current: SlotState): SlotState => {
  if (current === 'empty') return 'star';
  if (current === 'star') return 'cross';
  return 'empty';
};
const isDayPerfect = (dayState: SlotState[] | undefined): boolean => {
  return !!dayState && dayState.length === 3 && dayState.every((slot) => slot === 'star');
};
const isWeekPerfect = (weekData: WeekData | null): boolean => {
  if (!weekData) return false;
  const allSlots = Object.values(weekData).flat();
  return allSlots.length === 21 && allSlots.every((slot) => slot === 'star');
};
const initialState: ChartState = {
  children: [],
  selectedChild: null,
  currentDate: new Date(),
  weekData: null,
  isLoading: true,
  isFetchingChildren: false,
  isUpdating: {},
};
export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    ...initialState,
    fetchChildren: async () => {
      set({ isFetchingChildren: true });
      try {
        const children = await api<Child[]>('/api/children');
        set({ children });
      } catch (error) {
        toast.error('Could not load children.');
      } finally {
        set({ isFetchingChildren: false });
      }
    },
    selectChild: (childId) => {
      const child = get().children.find(c => c.id === childId);
      if (child) {
        set({ selectedChild: child, weekData: null, isLoading: true });
      }
    },
    createChild: async (name) => {
      try {
        const response = await api<CreateChildResponse>('/api/children', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        set(state => {
          state.children.push(response.child);
        });
        useAuthStore.getState().setUser(response.user);
        toast.success(`'${name}' has been added!`);
      } catch (error) {
        toast.error('Failed to create child.');
      }
    },
    setDate: (date) => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      set({ currentDate: date, isLoading: true, weekData: null });
      get().fetchWeekData(date, childId);
    },
    fetchWeekData: async (date, childId) => {
      set({ isLoading: true });
      try {
        const { year, week } = getWeekInfo(date);
        const response = await api<ChartWeek>(`/api/children/${childId}/chart/${year}/${week}`);
        set({ weekData: response.data, isLoading: false });
      } catch (error) {
        toast.error('Could not load week data.');
        set({ isLoading: false });
      }
    },
    updateSlotState: async (dayIndex, slotIndex, currentState) => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      const updateKey = `${dayIndex}-${slotIndex}`;
      set((state) => { state.isUpdating[updateKey] = true; });
      const nextState = getNextState(currentState);
      const originalState = get().weekData;
      const wasDayPerfectBefore = isDayPerfect(originalState?.[dayIndex]);
      const wasWeekPerfectBefore = isWeekPerfect(originalState);
      set((state) => { if (state.weekData) { state.weekData[dayIndex][slotIndex] = nextState; } });
      const isDayPerfectAfter = isDayPerfect(get().weekData?.[dayIndex]);
      const isWeekPerfectAfter = isWeekPerfect(get().weekData);
      try {
        const { year, week } = getWeekInfo(get().currentDate);
        const response = await api<UpdateSlotResponse>(`/api/children/${childId}/chart/${year}/${week}`, {
          method: 'POST',
          body: JSON.stringify({ dayIndex, slotIndex, state: nextState }),
        });
        if (response.child) {
            set(state => {
                state.selectedChild = response.child;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = response.child;
            });
        }
        const prizeMode = get().selectedChild?.prizeMode;
        if (prizeMode === 'daily' && !wasDayPerfectBefore && isDayPerfectAfter) {
          toast.success("Perfect Day! You've earned a prize! 🌟");
          await get().incrementPrizes();
        } else if (prizeMode === 'weekly' && !wasWeekPerfectBefore && isWeekPerfectAfter) {
          toast.success("🎉 Perfect Week! You've earned a prize! 🎉");
          await get().incrementPrizes();
        }
      } catch (error) {
        toast.error('Failed to save change. Reverting.');
        set({ weekData: originalState });
      } finally {
        set((state) => { state.isUpdating[updateKey] = false; });
      }
    },
    updateChildSettings: async (settings) => {
      const child = get().selectedChild;
      if (!child) return;
      const originalChild = { ...child };
      const updatedChild = { ...child, ...settings };
      set({ selectedChild: updatedChild });
      try {
        await api<Child>(`/api/children/${child.id}/settings`, {
          method: 'POST',
          body: JSON.stringify(settings),
        });
        set(state => {
            const childIndex = state.children.findIndex(c => c.id === child.id);
            if (childIndex !== -1) state.children[childIndex] = updatedChild;
        });
        toast.success('Settings updated!');
      } catch (error) {
        toast.error('Could not save settings.');
        set({ selectedChild: originalChild });
      }
    },
    incrementPrizes: async () => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      try {
        const updatedChild = await api<Child>(`/api/children/${childId}/prizes/increment`, {
          method: 'POST',
        });
        set(state => {
            state.selectedChild = updatedChild;
            const childIndex = state.children.findIndex(c => c.id === childId);
            if (childIndex !== -1) state.children[childIndex] = updatedChild;
        });
      } catch (error) {
        toast.error('Could not update prize count.');
      }
    },
    resetCurrentWeek: async () => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      const originalState = get().weekData;
      set({ isLoading: true });
      try {
        const { year, week } = getWeekInfo(get().currentDate);
        const response = await api<ChartWeek>(`/api/children/${childId}/chart/${year}/${week}/reset`, {
          method: 'POST',
        });
        set({ weekData: response.data, isLoading: false });
        toast.success('Week has been reset!');
      } catch (error) {
        toast.error('Could not reset the week.');
        set({ weekData: originalState, isLoading: false });
      }
    },
    addPrizeTarget: async (target) => {
        const childId = get().selectedChild?.id;
        if (!childId) return;
        try {
            const updatedChild = await api<Child>(`/api/children/${childId}/targets`, {
                method: 'POST', body: JSON.stringify(target)
            });
            set(state => {
                state.selectedChild = updatedChild;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = updatedChild;
            });
            toast.success('Prize target added!');
        } catch (error) { toast.error('Failed to add prize target.'); }
    },
    updatePrizeTarget: async (targetId, updates) => {
        const childId = get().selectedChild?.id;
        if (!childId) return;
        try {
            const updatedChild = await api<Child>(`/api/children/${childId}/targets/${targetId}`, {
                method: 'PUT', body: JSON.stringify(updates)
            });
            set(state => {
                state.selectedChild = updatedChild;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = updatedChild;
            });
            toast.success('Prize target updated!');
        } catch (error) { toast.error('Failed to update prize target.'); }
    },
    deletePrizeTarget: async (targetId) => {
        const childId = get().selectedChild?.id;
        if (!childId) return;
        try {
            const updatedChild = await api<Child>(`/api/children/${childId}/targets/${targetId}`, {
                method: 'DELETE'
            });
            set(state => {
                state.selectedChild = updatedChild;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = updatedChild;
            });
            toast.success('Prize target removed.');
        } catch (error) { toast.error('Failed to remove prize target.'); }
    },
    clearSelection: () => {
      set({ selectedChild: null, weekData: null });
    },
    reset: () => set(initialState),
  }))
);
useAuthStore.subscribe(
  (state, prevState) => {
    if (prevState.isAuthenticated && !state.isAuthenticated) {
      useChartStore.getState().reset();
    }
  }
);