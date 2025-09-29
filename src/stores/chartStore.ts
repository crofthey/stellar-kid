import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { getWeekInfo } from '@/lib/dateUtils';
import type { ChartWeek, SlotState, WeekData, DayState, Child, CreateChildResponse, PrizeTarget, UpdateSlotResponse, ResetChartResponse } from '@shared/types';
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
  updateChildSettings: (settings: Partial<Pick<Child, 'name' | 'prizeMode' | 'backgroundPattern'>>) => Promise<void>;
  incrementPrizes: () => Promise<void>;
  decrementPrizes: () => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  resetChart: () => Promise<void>;
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
const ensureBackground = (child: Child): Child => ({
  ...child,
  backgroundPattern: child.backgroundPattern ?? 'confetti',
  totalPerfectWeeks: child.totalPerfectWeeks ?? 0,
});
export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    ...initialState,
    fetchChildren: async () => {
      set({ isFetchingChildren: true });
      try {
        const children = await api<Child[]>('/api/children');
        set({ children: children.map(ensureBackground) });
      } catch (error) {
        toast.error('Could not load children.');
      } finally {
        set({ isFetchingChildren: false });
      }
    },
    selectChild: (childId) => {
      const child = get().children.find(c => c.id === childId);
      if (child) {
        set({ selectedChild: ensureBackground(child), weekData: null, isLoading: true });
      }
    },
    createChild: async (name) => {
      try {
        const response = await api<CreateChildResponse>('/api/children', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        set(state => {
          state.children.push(ensureBackground(response.child));
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
      if (import.meta.env.DEV) {
        console.log('[chartStore] fetchWeekData:start', {
          childId,
          date: date.toISOString(),
        });
      }
      set({ isLoading: true });
      try {
        const { year, week } = getWeekInfo(date);
        const response = await api<ChartWeek>(`/api/children/${childId}/chart/${year}/${week}`);
        if (import.meta.env.DEV) {
          console.log('[chartStore] fetchWeekData:success', {
            childId,
            week,
            year,
            dataPreview: response.data,
          });
        }
        set({ weekData: response.data, isLoading: false });
      } catch (error) {
        toast.error('Could not load week data.');
        if (import.meta.env.DEV) {
          console.error('[chartStore] fetchWeekData:error', error);
        }
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
      if (import.meta.env.DEV) {
        console.log('[chartStore] updateSlotState:optimistic', {
          childId,
          dayIndex,
          slotIndex,
          from: currentState,
          to: nextState,
        });
      }
      set((state) => {
        if (state.weekData) {
          const clonedWeek: WeekData = { ...state.weekData };
          const currentDay = clonedWeek[dayIndex];
          if (!currentDay) return;
          const clonedDay = [...currentDay] as SlotState[];
          clonedDay[slotIndex] = nextState;
          clonedWeek[dayIndex] = clonedDay as DayState;
          state.weekData = clonedWeek;
        }
      });
      const isDayPerfectAfter = isDayPerfect(get().weekData?.[dayIndex]);
      const isWeekPerfectAfter = isWeekPerfect(get().weekData);
      try {
        const { year, week } = getWeekInfo(get().currentDate);
        const response = await api<UpdateSlotResponse>(`/api/children/${childId}/chart/${year}/${week}`, {
          method: 'POST',
          body: JSON.stringify({ dayIndex, slotIndex, state: nextState }),
        });
        if (response.chartWeek) {
          if (import.meta.env.DEV) {
            console.log('[chartStore] updateSlotState:server week data', {
              childId,
              dayIndex,
              slotIndex,
              received: response.chartWeek.data,
            });
          }
          set(state => {
            state.weekData = response.chartWeek.data;
          });
        }
        if (response.child) {
            if (import.meta.env.DEV) {
              console.log('[chartStore] updateSlotState:received child delta', {
                childId,
                prizeCount: response.child.prizeCount,
                prizeMode: response.child.prizeMode,
              });
            }
            set(state => {
                const ensured = ensureBackground(response.child);
                state.selectedChild = ensured;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = ensured;
            });
        }
        const prizeMode = get().selectedChild?.prizeMode;
        if (prizeMode === 'daily') {
          if (!wasDayPerfectBefore && isDayPerfectAfter) {
            toast.success("Perfect Day! You've earned a prize! 🌟");
            await get().incrementPrizes();
          } else if (wasDayPerfectBefore && !isDayPerfectAfter) {
            await get().decrementPrizes();
          }
        } else if (prizeMode === 'weekly') {
          if (!wasWeekPerfectBefore && isWeekPerfectAfter) {
            toast.success("🎉 Perfect Week! You've earned a prize! 🎉");
            await get().incrementPrizes();
          } else if (wasWeekPerfectBefore && !isWeekPerfectAfter) {
            await get().decrementPrizes();
          }
        }
      } catch (error) {
        toast.error('Failed to save change. Reverting.');
        if (import.meta.env.DEV) {
          console.error('[chartStore] updateSlotState:error', error);
        }
        set({ weekData: originalState });
      } finally {
        set((state) => { state.isUpdating[updateKey] = false; });
        if (import.meta.env.DEV) {
          console.log('[chartStore] updateSlotState:complete', {
            childId,
            dayIndex,
            slotIndex,
            isUpdating: get().isUpdating[updateKey],
          });
        }
      }
    },
    updateChildSettings: async (settings) => {
      const child = get().selectedChild;
      if (!child) return;
      const originalChild = ensureBackground(child);
      const updatedChild = ensureBackground({
        ...child,
        ...settings,
        backgroundPattern: settings.backgroundPattern ?? child.backgroundPattern ?? 'confetti',
      });
      if (settings.prizeMode) {
        updatedChild.prizeCount = settings.prizeMode === 'daily'
          ? updatedChild.totalPerfectDays || 0
          : updatedChild.totalPerfectWeeks || 0;
      }
      set({ selectedChild: updatedChild });
      try {
        const serverChild = await api<Child>(`/api/children/${child.id}/settings`, {
          method: 'POST',
          body: JSON.stringify(settings),
        });
        set(state => {
            const childIndex = state.children.findIndex(c => c.id === child.id);
            const ensured = ensureBackground(serverChild);
            state.selectedChild = ensured;
            if (childIndex !== -1) state.children[childIndex] = ensured;
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
            const ensured = ensureBackground(updatedChild);
            state.selectedChild = ensured;
            const childIndex = state.children.findIndex(c => c.id === childId);
            if (childIndex !== -1) state.children[childIndex] = ensured;
        });
      } catch (error) {
        toast.error('Could not update prize count.');
      }
    },
    decrementPrizes: async () => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      if ((get().selectedChild?.prizeCount || 0) === 0) return;
      try {
        const updatedChild = await api<Child>(`/api/children/${childId}/prizes/decrement`, {
          method: 'POST',
        });
        set(state => {
            const ensured = ensureBackground(updatedChild);
            state.selectedChild = ensured;
            const childIndex = state.children.findIndex(c => c.id === childId);
            if (childIndex !== -1) state.children[childIndex] = ensured;
        });
      } catch (error) {
        toast.error('Could not update prize count.');
      }
    },
    deleteChild: async (childId) => {
      try {
        await api<{ success: boolean }>(`/api/children/${childId}`, {
          method: 'DELETE',
        });
        set(state => {
          state.children = state.children.filter(c => c.id !== childId);
          if (state.selectedChild?.id === childId) {
            state.selectedChild = null;
            state.weekData = null;
          }
        });
        toast.success('Child has been removed.');
      } catch (error) {
        toast.error('Could not delete child.');
      }
    },
    resetChart: async () => {
      const childId = get().selectedChild?.id;
      if (!childId) return;
      const originalState = get().weekData;
      const originalChild = get().selectedChild;
      set({ isLoading: true });
      try {
        const { year, week } = getWeekInfo(get().currentDate);
        const response = await api<ResetChartResponse>(`/api/children/${childId}/chart/${year}/${week}/reset`, {
          method: 'POST',
        });
        set((state) => {
          const ensured = ensureBackground(response.child);
          state.weekData = response.chartWeek.data;
          state.isLoading = false;
          state.selectedChild = ensured;
          const childIndex = state.children.findIndex((c) => c.id === childId);
          if (childIndex !== -1) {
            state.children[childIndex] = ensured;
          }
        });
        toast.success('Chart has been reset!');
      } catch (error) {
        toast.error('Could not reset the chart.');
        set((state) => {
          state.weekData = originalState;
          state.selectedChild = originalChild;
          state.isLoading = false;
        });
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
                const ensured = ensureBackground(updatedChild);
                state.selectedChild = ensured;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = ensured;
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
                const ensured = ensureBackground(updatedChild);
                state.selectedChild = ensured;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = ensured;
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
                const ensured = ensureBackground(updatedChild);
                state.selectedChild = ensured;
                const childIndex = state.children.findIndex(c => c.id === childId);
                if (childIndex !== -1) state.children[childIndex] = ensured;
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
