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
}
export type UserResponse = Omit<User, 'hashedPassword' | 'passwordResetToken' | 'passwordResetExpires'>;
// Prize Target
export interface PrizeTarget {
    id: string;
    childId: string;
    name: string;
    type: 'stars' | 'days';
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
