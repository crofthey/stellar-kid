import { Entity, IndexedEntity, Env } from "./core-utils";
import type { ChartWeek, DayState, SlotState, WeekData, User, Child, PrizeTarget, PasswordResetRequest } from "@shared/types";
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
        lastLoginAt: undefined,
        loginCount: 0,
    };
    async addChild(childId: string): Promise<User> {
        return this.mutate(s => ({
            ...s,
            childIds: [...(s.childIds || []), childId],
        }));
    }
    async removeChild(childId: string): Promise<User> {
        return this.mutate(s => ({
            ...s,
            childIds: (s.childIds || []).filter(id => id !== childId),
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
    async recordLogin(): Promise<User> {
        const timestamp = Date.now();
        return this.mutate(s => ({
            ...s,
            lastLoginAt: timestamp,
            loginCount: (s.loginCount || 0) + 1,
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
        prizeMode: 'daily',
        prizeTargets: [],
        totalStars: 0,
        totalPerfectDays: 0,
        totalPerfectWeeks: 0,
        backgroundPattern: 'confetti',
    };
    private static ensureBackground(state: Child): Child {
        return {
            ...state,
            backgroundPattern: state.backgroundPattern ?? 'confetti',
            totalPerfectWeeks: state.totalPerfectWeeks ?? 0,
        };
    }
    async updateSettings(settings: Partial<Pick<Child, 'name' | 'prizeMode' | 'backgroundPattern'>>): Promise<Child> {
        return this.mutate(s => {
            let merged = { ...s, ...settings } as Child;
            merged = ChildEntity.ensureBackground(merged);
            if (settings.prizeMode) {
                const recalculatedPrizeCount = settings.prizeMode === 'daily'
                    ? merged.totalPerfectDays || 0
                    : merged.totalPerfectWeeks || 0;
                merged = {
                    ...merged,
                    prizeCount: recalculatedPrizeCount,
                };
            }
            if (settings.backgroundPattern !== undefined) {
                merged = {
                    ...merged,
                    backgroundPattern: settings.backgroundPattern,
                };
            }
            return merged;
        });
    }
    async incrementPrizes(): Promise<Child> {
        return this.mutate(s => ChildEntity.ensureBackground({
            ...s,
            prizeCount: (s.prizeCount || 0) + 1,
        }));
    }
    async decrementPrizes(): Promise<Child> {
        return this.mutate(s => ChildEntity.ensureBackground({
            ...s,
            prizeCount: Math.max(0, (s.prizeCount || 0) - 1),
        }));
    }
    async addPrizeTarget(target: PrizeTarget): Promise<Child> {
        return this.mutate(s => {
            const base = ChildEntity.ensureBackground(s);
            return ChildEntity.ensureBackground({
                ...base,
                prizeTargets: [...(base.prizeTargets || []), target],
            });
        });
    }
    async updatePrizeTarget(targetId: string, updates: Partial<Omit<PrizeTarget, 'id' | 'childId'>>): Promise<Child> {
        return this.mutate(s => {
            const base = ChildEntity.ensureBackground(s);
            const targets = base.prizeTargets || [];
            const targetIndex = targets.findIndex(t => t.id === targetId);
            if (targetIndex === -1) return base;
            const updatedTarget = { ...targets[targetIndex], ...updates };
            const newTargets = [...targets];
            newTargets[targetIndex] = updatedTarget;
            return ChildEntity.ensureBackground({ ...base, prizeTargets: newTargets });
        });
    }
    async deletePrizeTarget(targetId: string): Promise<Child> {
        return this.mutate(s => {
            const base = ChildEntity.ensureBackground(s);
            return ChildEntity.ensureBackground({
                ...base,
                prizeTargets: (base.prizeTargets || []).filter(t => t.id !== targetId),
            });
        });
    }
    async updateStats(starDelta: number, perfectDayDelta: number, perfectWeekDelta: number = 0): Promise<Child> {
        return this.mutate(s => {
            const base = ChildEntity.ensureBackground(s);
            const newTotalStars = (base.totalStars || 0) + starDelta;
            const newTotalPerfectDays = (base.totalPerfectDays || 0) + perfectDayDelta;
            const newTotalPerfectWeeks = (base.totalPerfectWeeks || 0) + perfectWeekDelta;
            const updatedTargets = (base.prizeTargets || []).map(target => {
                if (target.isAchieved) return target;
                const progress = target.type === 'stars'
                    ? newTotalStars
                    : target.type === 'days'
                        ? newTotalPerfectDays
                        : newTotalPerfectWeeks;
                if (progress >= target.targetCount) {
                    return { ...target, isAchieved: true, achievedAt: Date.now() };
                }
                return target;
            });
            return ChildEntity.ensureBackground({
                ...base,
                totalStars: newTotalStars,
                totalPerfectDays: newTotalPerfectDays,
                totalPerfectWeeks: newTotalPerfectWeeks,
                prizeTargets: updatedTargets,
            });
        });
    }
    async resetChartProgress(): Promise<Child> {
        return this.mutate(s => {
            const base = ChildEntity.ensureBackground(s);
            return ChildEntity.ensureBackground({
                ...base,
                prizeCount: 0,
                totalStars: 0,
                totalPerfectDays: 0,
                totalPerfectWeeks: 0,
                prizeTargets: (base.prizeTargets || []).map(target => ({
                    ...target,
                    isAchieved: false,
                    achievedAt: undefined,
                })),
            });
        });
    }
}

type SystemStats = {
    totalSlotUpdates: number;
};

export class SystemStatsEntity extends Entity<SystemStats> {
    static readonly entityName = "system-stats";
    static readonly initialState: SystemStats = {
        totalSlotUpdates: 0,
    };
    constructor(env: Env, id: string = 'global') {
        super(env, id);
    }
    async incrementSlotUpdates(): Promise<SystemStats> {
        return this.mutate(s => ({
            ...s,
            totalSlotUpdates: (s.totalSlotUpdates || 0) + 1,
        }));
    }
}

export class PasswordResetRequestEntity extends IndexedEntity<PasswordResetRequest> {
    static readonly entityName = "password-reset-request";
    static readonly indexName = "password-reset-requests";
    static readonly initialState: PasswordResetRequest = {
        id: "",
        email: "",
        createdAt: 0,
        status: 'pending',
    };
}
// STELLARKID CHART ENTITY
const createInitialWeekData = (): WeekData => {
    return Array.from({ length: 7 }).reduce((acc: WeekData, _, i) => {
        acc[i] = ['empty', 'empty', 'empty'] as DayState;
        return acc;
    }, {} as WeekData);
};
const initialWeekData: WeekData = createInitialWeekData();
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
        return this.mutate(s => ({
            ...s,
            data: createInitialWeekData(),
        }));
    }
}
