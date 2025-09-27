import { Entity, IndexedEntity, Env } from "./core-utils";
import type { ChartWeek, DayState, SlotState, WeekData, User, Child, PrizeTarget } from "@shared/types";
import { hashPassword } from './auth';
// USER (PARENT) ENTITY
export class UserEntity extends IndexedEntity<User> {
    static readonly entityName = "user";
    static readonly indexName = "users-by-email";
    static readonly initialState: User = {
        id: "",
        email: "",
        hashedPassword: "",
        childIds: [],
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
    };
    async addChild(childId: string): Promise<User> {
        return this.mutate(s => ({
            ...s,
            childIds: [...(s.childIds || []), childId],
        }));
    }
    async setPasswordResetToken(): Promise<string> {
        const resetToken = crypto.randomUUID();
        const tokenBuffer = new TextEncoder().encode(resetToken);
        const hashedToken = await crypto.subtle.digest('SHA-256', tokenBuffer);
        const hashedTokenHex = Array.from(new Uint8Array(hashedToken)).map(b => b.toString(16).padStart(2, '0')).join('');
        const expires = Date.now() + 3600000; // 1 hour from now
        await this.mutate(s => ({
            ...s,
            passwordResetToken: hashedTokenHex,
            passwordResetExpires: expires,
        }));
        return resetToken;
    }
    async resetPassword(newPassword: string): Promise<User> {
        const newHashedPassword = await hashPassword(newPassword);
        return this.mutate(s => ({
            ...s,
            hashedPassword: newHashedPassword,
            passwordResetToken: undefined,
            passwordResetExpires: undefined,
        }));
    }
}
// CHILD ENTITY
export class ChildEntity extends IndexedEntity<Child> {
    static readonly entityName = "child";
    static readonly indexName = "children-by-id";
    static readonly initialState: Child = {
        id: "",
        parentId: "",
        name: "My Child",
        prizeCount: 0,
        prizeMode: 'weekly',
        prizeTargets: [],
        totalStars: 0,
        totalPerfectDays: 0,
    };
    async updateSettings(settings: Partial<Pick<Child, 'name' | 'prizeMode'>>): Promise<Child> {
        return this.mutate(s => ({ ...s, ...settings }));
    }
    async incrementPrizes(): Promise<Child> {
        return this.mutate(s => ({ ...s, prizeCount: (s.prizeCount || 0) + 1 }));
    }
    async addPrizeTarget(target: PrizeTarget): Promise<Child> {
        return this.mutate(s => ({ ...s, prizeTargets: [...(s.prizeTargets || []), target] }));
    }
    async updatePrizeTarget(targetId: string, updates: Partial<Omit<PrizeTarget, 'id' | 'childId'>>): Promise<Child> {
        return this.mutate(s => {
            const targets = s.prizeTargets || [];
            const targetIndex = targets.findIndex(t => t.id === targetId);
            if (targetIndex === -1) return s;
            const updatedTarget = { ...targets[targetIndex], ...updates };
            const newTargets = [...targets];
            newTargets[targetIndex] = updatedTarget;
            return { ...s, prizeTargets: newTargets };
        });
    }
    async deletePrizeTarget(targetId: string): Promise<Child> {
        return this.mutate(s => ({
            ...s,
            prizeTargets: (s.prizeTargets || []).filter(t => t.id !== targetId),
        }));
    }
    async updateStats(starDelta: number, perfectDayDelta: number): Promise<Child> {
        return this.mutate(s => {
            const newTotalStars = (s.totalStars || 0) + starDelta;
            const newTotalPerfectDays = (s.totalPerfectDays || 0) + perfectDayDelta;
            const updatedTargets = (s.prizeTargets || []).map(target => {
                if (target.isAchieved) return target;
                const progress = target.type === 'stars' ? newTotalStars : newTotalPerfectDays;
                if (progress >= target.targetCount) {
                    return { ...target, isAchieved: true, achievedAt: Date.now() };
                }
                return target;
            });
            return {
                ...s,
                totalStars: newTotalStars,
                totalPerfectDays: newTotalPerfectDays,
                prizeTargets: updatedTargets,
            };
        });
    }
}
// STELLARKID CHART ENTITY
const initialWeekData: WeekData = Array.from({ length: 7 }).reduce((acc: WeekData, _, i) => {
    acc[i] = ['empty', 'empty', 'empty'] as DayState;
    return acc;
}, {} as WeekData);
export class ChartWeekEntity extends Entity<ChartWeek> {
    static readonly entityName = "chart-week";
    static readonly initialState: ChartWeek = { id: "", data: initialWeekData };
    static async findOrCreate(env: Env, weekId: string): Promise<ChartWeek> {
        const chartWeek = new ChartWeekEntity(env, weekId);
        // This atomic operation gets the state, or creates it with initial data if it doesn't exist.
        return chartWeek.mutate(state => {
            if (!state.id) {
                // State is uninitialized, inject ID and initial data.
                return { ...ChartWeekEntity.initialState, id: weekId };
            }
            // State already exists, return as is.
            return state;
        });
    }
    async updateSlot(dayIndex: number, slotIndex: number, newState: SlotState): Promise<ChartWeek> {
        if (dayIndex < 0 || dayIndex > 6 || slotIndex < 0 || slotIndex > 2) {
            throw new Error("Invalid day or slot index");
        }
        return this.mutate(s => {
            const newData = { ...s.data };
            const newDayState = [...(newData[dayIndex] || ['empty', 'empty', 'empty'])] as DayState;
            newDayState[slotIndex] = newState;
            newData[dayIndex] = newDayState;
            return { ...s, data: newData };
        });
    }
    async resetWeek(): Promise<ChartWeek> {
        return this.mutate(s => {
            return { ...s, data: initialWeekData };
        });
    }
}