export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Auth
export interface AuthResponse {
    token: string;
    user: UserResponse;
}
// User (Parent)
export interface User {
    id: string;
    email: string;
    hashedPassword: string;
    childIds: string[];
    passwordResetToken?: string;
    passwordResetExpires?: number;
    lastLoginAt?: number;
    loginCount?: number;
    lastInteractionAt?: number;
}
export type UserResponse = Omit<User, 'hashedPassword' | 'passwordResetToken' | 'passwordResetExpires'>;
// Prize Target
export type PrizeTargetType = 'stars' | 'days' | 'weeks';
export interface PrizeTarget {
    id: string;
    childId: string;
    name: string;
    type: PrizeTargetType;
    targetCount: number;
    isAchieved: boolean;
    achievedAt?: number;
}
// Child
export type BackgroundPattern = 'confetti' | 'rainbow' | 'meadow' | 'ocean';
export interface Child {
    id: string;
    parentId: string;
    name: string;
    prizeCount: number;
    prizeMode: 'daily' | 'weekly';
    prizeTargets: PrizeTarget[];
    totalStars: number;
    totalPerfectDays: number;
    totalPerfectWeeks: number;
    backgroundPattern: BackgroundPattern;
}
export interface CreateChildResponse {
    child: Child;
    user: UserResponse;
}
// StellarKid Types
export type SlotState = 'empty' | 'star' | 'cross';
export type DayState = [SlotState, SlotState, SlotState]; // Morning, Afternoon, Evening
export type WeekData = {
    // 0: Monday, 1: Tuesday, ..., 6: Sunday
    [dayIndex: number]: DayState;
};
export interface ChartWeek {
    id: string; // "childId:YYYY-Www", e.g., "child-123:2024-W34"
    data: WeekData;
}
export interface UpdateSlotResponse {
    chartWeek: ChartWeek;
    child?: Child;
}

export interface ResetChartResponse {
    chartWeek: ChartWeek;
    child: Child;
}

export interface AdminStats {
    totalAccounts: number;
    totalChildren: number;
    totalSlotUpdates: number;
    totalLogins: number;
    lastInteractionAt: number | null;
    lastLoginAt: number | null;
    lastLoginEmail: string | null;
    accounts: AdminAccountSummary[];
    resetRequests: PasswordResetRequest[];
    feedbackMessages: FeedbackMessage[];
}

export interface AdminAccountSummary {
    email: string;
    lastLoginAt: number | null;
    loginCount: number;
    childCount: number;
    totalPrizeTargets: number;
    totalSlotUpdates: number;
    lastInteractionAt: number | null;
}

export type PasswordResetRequestStatus = 'pending' | 'completed';

export interface PasswordResetRequest {
    id: string;
    email: string;
    createdAt: number;
    status: PasswordResetRequestStatus;
    resolvedAt?: number;
    resolvedBy?: string;
}

export type FeedbackStatus = 'new' | 'read';

export interface FeedbackMessage {
    id: string;
    email: string;
    message: string;
    createdAt: number;
    status: FeedbackStatus;
    resolvedAt?: number;
    resolvedBy?: string;
}
