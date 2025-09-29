import { Hono } from "hono";
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env } from './core-utils';
import { UserEntity, ChildEntity, ChartWeekEntity, SystemStatsEntity, PasswordResetRequestEntity, FeedbackMessageEntity } from "./entities";
import { ok, bad, isStr, Index, notFound } from './core-utils';
import { hashPassword, verifyPassword, signToken, authMiddleware } from './auth';
import type { SlotState, Child, UserResponse, PrizeTarget, DayState, WeekData, AdminStats, AdminAccountSummary } from "@shared/types";
type AuthVariables = {
    user: UserEntity;
};
const isDayPerfect = (dayState: DayState | undefined): boolean => {
  return !!dayState && dayState.length === 3 && dayState.every((slot) => slot === 'star');
};
const isWeekPerfect = (weekData: WeekData | Record<number, DayState>): boolean => {
  const days = Object.values(weekData || {});
  const allSlots = days.flat();
  return allSlots.length === 21 && allSlots.every((slot) => slot === 'star');
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const requireAdminKey = (c: Context) => {
    const configuredKey = c.env.ADMIN_API_KEY;
    if (!configuredKey) {
      throw new HTTPException(500, { message: 'Admin key not configured.' });
    }
    const authHeader = c.req.header('Authorization') || '';
    const providedKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!providedKey || providedKey !== configuredKey) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }
  };
  // --- PUBLIC AUTH ROUTES ---
  app.post('/api/auth/register', async (c) => {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password) || password.length < 6) {
      return bad(c, 'Invalid email or password (must be at least 6 characters).');
    }
    const emailKey = email.toLowerCase();
    const userExists = await new UserEntity(c.env, emailKey).exists();
    if (userExists) {
      return bad(c, 'A user with this email already exists.');
    }
    const hashedPassword = await hashPassword(password);
    const userState = { id: emailKey, email: emailKey, hashedPassword, childIds: [] };
    const newUser = new UserEntity(c.env, emailKey);
    await newUser.save(userState);
    const userIndex = new Index<string>(c.env, UserEntity.indexName);
    await userIndex.add(emailKey);
    const token = await signToken({ userId: emailKey });
    const userResponse: UserResponse = { id: emailKey, email: emailKey, childIds: [] };
    return ok(c, { token, user: userResponse });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password)) {
      return bad(c, 'Email and password are required.');
    }
    const emailKey = email.toLowerCase();
    const user = new UserEntity(c.env, emailKey);
    if (!(await user.exists())) {
      return bad(c, 'User not found.');
    }
    const { hashedPassword, id, childIds } = await user.getState();
    const passwordMatch = await verifyPassword(password, hashedPassword);
    if (!passwordMatch) {
      return bad(c, 'Incorrect password.');
    }
    await user.recordLogin();
    const token = await signToken({ userId: id });
    const userResponse: UserResponse = { id, email: emailKey, childIds };
    return ok(c, { token, user: userResponse });
  });
  app.post('/api/auth/forgot-password', async (c) => {
    const { email } = await c.req.json<{ email?: string }>();
    if (!isStr(email)) return bad(c, 'Email is required.');
    const emailKey = email.toLowerCase();
    const user = new UserEntity(c.env, emailKey);
    if (!(await user.exists())) {
      return ok(c, { message: 'If a user with that email exists, an administrator will reach out shortly.' });
    }
    await user.setPasswordResetToken();
    const requestId = crypto.randomUUID();
    await PasswordResetRequestEntity.create(c.env, {
      id: requestId,
      email: emailKey,
      createdAt: Date.now(),
      status: 'pending',
    });
    console.log(`Password reset request captured for ${emailKey} (${requestId})`);
    return ok(c, { message: 'Password reset request received. An administrator will update your account soon.' });
  });
  app.post('/api/auth/reset-password', async (c) => {
    const { token, password } = await c.req.json<{ token?: string; password?: string }>();
    if (!isStr(token) || !isStr(password) || password.length < 6) {
      return bad(c, 'A valid token and a new password (min. 6 characters) are required.');
    }
    const userIndex = new Index<string>(c.env, UserEntity.indexName);
    const allUserIds = await userIndex.list();
    let targetUser: UserEntity | null = null;
    for (const userId of allUserIds) {
      const user = new UserEntity(c.env, userId);
      const state = await user.getState();
      if (state.passwordResetToken && state.passwordResetExpires && state.passwordResetExpires > Date.now()) {
        const tokenBuffer = new TextEncoder().encode(token);
        const hashedToken = await crypto.subtle.digest('SHA-256', tokenBuffer);
        const hashedTokenHex = Array.from(new Uint8Array(hashedToken)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashedTokenHex === state.passwordResetToken) {
          targetUser = user;
          break;
        }
      }
    }
    if (!targetUser) {
      return bad(c, 'Password reset token is invalid or has expired.');
    }
    await targetUser.resetPassword(password);
    return ok(c, { message: 'Password has been reset successfully.' });
  });
  // --- PROTECTED ROUTES ---
  const protectedRoutes = new Hono<{ Bindings: Env, Variables: AuthVariables }>();
  protectedRoutes.use('*', authMiddleware);
  // --- USER ROUTES ---
  protectedRoutes.get('/users/me', async (c) => {
    const user = c.get('user');
    const { id, email, childIds } = await user.getState();
    const userResponse: UserResponse = { id, email, childIds };
    return ok(c, userResponse);
  });
  // --- CHILDREN ROUTES ---
  protectedRoutes.get('/children', async (c) => {
    const user = c.get('user');
    const { childIds } = await user.getState();
    if (!childIds || childIds.length === 0) {
      return ok(c, []);
    }
    const children = await Promise.all(
      childIds.map(id => new ChildEntity(c.env, id).getState())
    );
    return ok(c, children);
  });
  protectedRoutes.post('/children', async (c) => {
    const user = c.get('user');
    const { name } = await c.req.json<{ name?: string }>();
    if (!isStr(name)) {
      return bad(c, 'Child name is required.');
    }
    const childId = crypto.randomUUID();
    const childState: Child = { ...ChildEntity.initialState, id: childId, parentId: user.id, name };
    await ChildEntity.create(c.env, childState);
    const updatedUser = await user.addChild(childId);
    const userResponse: UserResponse = { id: updatedUser.id, email: updatedUser.email, childIds: updatedUser.childIds };
    return ok(c, { child: childState, user: userResponse });
  });
  // Guard child-specific routes so users can only access their own data
  protectedRoutes.use('/children/:childId/*', async (c, next) => {
    const user = c.get('user');
    const childId = c.req.param('childId');
    const { childIds } = await user.getState();
    if (!childIds.includes(childId)) {
      throw new HTTPException(403, { message: 'Forbidden: You do not have access to this child.' });
    }
    await next();
  });
  // --- CHILD-SPECIFIC CHART ROUTES ---
  const getWeekId = (childId: string, year: string, week: string) => `${childId}:${year}-W${week.padStart(2, '0')}`;
  protectedRoutes.get('/children/:childId/chart/:year/:week', async (c) => {
    const { childId, year, week } = c.req.param();
    const weekId = getWeekId(childId, year, week);
    const data = await ChartWeekEntity.findOrCreate(c.env, weekId);
    return ok(c, data);
  });
  protectedRoutes.post('/children/:childId/chart/:year/:week', async (c) => {
    const { childId, year, week } = c.req.param();
    const weekId = getWeekId(childId, year, week);
    const childEntity = new ChildEntity(c.env, childId);
    const childState = await childEntity.getState();
    const { dayIndex, slotIndex, state: newState } = await c.req.json<{ dayIndex: number; slotIndex: number; state: SlotState }>();
    if (dayIndex === undefined || slotIndex === undefined || !newState) {
      return bad(c, 'Missing dayIndex, slotIndex, or state');
    }
    const chartWeek = new ChartWeekEntity(c.env, weekId);
    const oldWeekState = await chartWeek.getState();
    const oldSlotState = oldWeekState.data[dayIndex]?.[slotIndex] || 'empty';
    const wasDayPerfectBefore = isDayPerfect(oldWeekState.data[dayIndex]);
    const wasWeekPerfectBefore = isWeekPerfect(oldWeekState.data);
    const updatedWeek = await chartWeek.updateSlot(dayIndex, slotIndex, newState);
    const isDayPerfectAfter = isDayPerfect(updatedWeek.data[dayIndex]);
    const isWeekPerfectAfter = isWeekPerfect(updatedWeek.data);
    let starDelta = 0;
    if (oldSlotState !== 'star' && newState === 'star') starDelta = 1;
    else if (oldSlotState === 'star' && newState !== 'star') starDelta = -1;
    let perfectDayDelta = 0;
    if (!wasDayPerfectBefore && isDayPerfectAfter) perfectDayDelta = 1;
    else if (wasDayPerfectBefore && !isDayPerfectAfter) perfectDayDelta = -1;
    let perfectWeekDelta = 0;
    if (!wasWeekPerfectBefore && isWeekPerfectAfter) perfectWeekDelta = 1;
    else if (wasWeekPerfectBefore && !isWeekPerfectAfter) perfectWeekDelta = -1;
    let updatedChild: Child | undefined;
    if (starDelta !== 0 || perfectDayDelta !== 0 || perfectWeekDelta !== 0) {
        updatedChild = await childEntity.updateStats(starDelta, perfectDayDelta, perfectWeekDelta);
    }
    const systemStats = new SystemStatsEntity(c.env);
    await systemStats.incrementSlotUpdates();
    if (childState.parentId) {
      const parent = new UserEntity(c.env, childState.parentId);
      await parent.recordInteraction();
    }
    return ok(c, { chartWeek: updatedWeek, child: updatedChild });
  });
  protectedRoutes.post('/children/:childId/chart/:year/:week/reset', async (c) => {
    const { childId, year, week } = c.req.param();
    const weekId = getWeekId(childId, year, week);
    const chartWeek = new ChartWeekEntity(c.env, weekId);
    const resetData = await chartWeek.resetWeek();
    const child = new ChildEntity(c.env, childId);
    const updatedChild = await child.resetChartProgress();
    return ok(c, { chartWeek: resetData, child: updatedChild });
  });
  // --- CHILD-SPECIFIC SETTINGS ROUTES ---
  protectedRoutes.post('/children/:childId/settings', async (c) => {
    const { childId } = c.req.param();
    const settingsUpdate = await c.req.json<Partial<Pick<Child, 'name' | 'prizeMode' | 'backgroundPattern'>>>();
    if (settingsUpdate.name !== undefined && !isStr(settingsUpdate.name)) {
        return bad(c, 'name must be a non-empty string');
    }
    if (settingsUpdate.prizeMode !== undefined && !['daily', 'weekly'].includes(settingsUpdate.prizeMode)) {
        return bad(c, 'Invalid prizeMode');
    }
    if (settingsUpdate.backgroundPattern !== undefined && !['confetti', 'rainbow', 'meadow', 'ocean'].includes(settingsUpdate.backgroundPattern)) {
        return bad(c, 'Invalid background option');
    }
    const child = new ChildEntity(c.env, childId);
    const updatedSettings = await child.updateSettings(settingsUpdate);
    return ok(c, updatedSettings);
  });
  protectedRoutes.post('/children/:childId/prizes/increment', async (c) => {
    const { childId } = c.req.param();
    const child = new ChildEntity(c.env, childId);
    const updatedSettings = await child.incrementPrizes();
    return ok(c, updatedSettings);
  });
  protectedRoutes.post('/children/:childId/prizes/decrement', async (c) => {
    const { childId } = c.req.param();
    const child = new ChildEntity(c.env, childId);
    const updatedSettings = await child.decrementPrizes();
    return ok(c, updatedSettings);
  });
  protectedRoutes.post('/feedback', async (c) => {
    const authUser = c.get('user');
    const { message } = await c.req.json<{ message?: string }>();
    if (!isStr(message)) {
      return bad(c, 'Feedback message is required.');
    }
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      return bad(c, 'Please provide a bit more detail so we can help.');
    }
    if (trimmed.length > 1000) {
      return bad(c, 'Feedback must be shorter than 1000 characters.');
    }
    const userState = await authUser.getState();
    const feedbackId = crypto.randomUUID();
    await FeedbackMessageEntity.create(c.env, {
      id: feedbackId,
      email: userState.email,
      message: trimmed,
      createdAt: Date.now(),
      status: 'new',
    });
    return ok(c, { message: 'Thanks for the feedback!' });
  });
  protectedRoutes.post('/auth/change-password', async (c) => {
    const authUser = c.get('user');
    const { currentPassword, newPassword } = await c.req.json<{ currentPassword?: string; newPassword?: string }>();
    if (!isStr(currentPassword) || !isStr(newPassword) || newPassword.length < 6) {
      return bad(c, 'Current password and a new password (min. 6 characters) are required.');
    }
    const state = await authUser.getState();
    const matches = await verifyPassword(currentPassword, state.hashedPassword);
    if (!matches) {
      return bad(c, 'Current password is incorrect.');
    }
    await authUser.resetPassword(newPassword);
    return ok(c, { message: 'Password updated successfully.' });
  });
  // --- CHILD-SPECIFIC PRIZE TARGET ROUTES ---
  protectedRoutes.post('/children/:childId/targets', async (c) => {
    const { childId } = c.req.param();
    const body = await c.req.json<{ name?: string; type?: 'stars' | 'days' | 'weeks'; targetCount?: number }>();
    if (!isStr(body.name)) {
        return bad(c, 'Prize name must be a non-empty string.');
    }
    if (!body.type || !['stars', 'days', 'weeks'].includes(body.type)) {
        return bad(c, 'Invalid goal type. Must be "stars", "days", or "weeks".');
    }
    if (typeof body.targetCount !== 'number' || !Number.isInteger(body.targetCount) || body.targetCount <= 0) {
        return bad(c, 'Goal count must be a positive whole number.');
    }
    const child = new ChildEntity(c.env, childId);
    if (!(await child.exists())) {
        return notFound(c, 'Child not found.');
    }
    const newTarget: PrizeTarget = {
        id: crypto.randomUUID(),
        childId,
        name: body.name,
        type: body.type,
        targetCount: body.targetCount,
        isAchieved: false
    };
    const updatedChild = await child.addPrizeTarget(newTarget);
    return ok(c, updatedChild);
  });
  protectedRoutes.put('/children/:childId/targets/:targetId', async (c) => {
    const { childId, targetId } = c.req.param();
    const updates = await c.req.json<Partial<Omit<PrizeTarget, 'id' | 'childId'>>>();
    const child = new ChildEntity(c.env, childId);
    if (!(await child.exists())) {
        return notFound(c, 'Child not found');
    }
    const updatedChild = await child.updatePrizeTarget(targetId, updates);
    return ok(c, updatedChild);
  });
  protectedRoutes.delete('/children/:childId/targets/:targetId', async (c) => {
    const { childId, targetId } = c.req.param();
    const child = new ChildEntity(c.env, childId);
    if (!(await child.exists())) {
        return notFound(c, 'Child not found');
    }
    const updatedChild = await child.deletePrizeTarget(targetId);
    return ok(c, updatedChild);
  });
  protectedRoutes.delete('/children/:childId', async (c) => {
    const authUser = c.get('user');
    const { childId } = c.req.param();
    const child = new ChildEntity(c.env, childId);
    if (!(await child.exists())) {
        return notFound(c, 'Child not found');
    }
    const childState = await child.getState();
    const userState = await authUser.getState();
    if (childState.parentId !== userState.id) {
        throw new HTTPException(403, { message: 'Forbidden: You do not have access to this child.' });
    }
    await child.delete();
    const childIndex = new Index<string>(c.env, ChildEntity.indexName);
    await childIndex.remove(childId);
    await authUser.removeChild(childId);
    return ok(c, { success: true });
  });

  app.get('/api/admin/stats', async (c) => {
    requireAdminKey(c);
    const statsEntity = new SystemStatsEntity(c.env);
    const systemStats = await statsEntity.getState();

    const userIndex = new Index<string>(c.env, UserEntity.indexName);
    const userIds = await userIndex.list();
    const users = await Promise.all(userIds.map((id) => new UserEntity(c.env, id).getState()));

    const childIndex = new Index<string>(c.env, ChildEntity.indexName);
    const childIds = await childIndex.list();

    let lastLoginAt: number | null = null;
    let lastLoginEmail: string | null = null;
    let totalLogins = 0;
    for (const user of users) {
      if (user.lastLoginAt && (!lastLoginAt || user.lastLoginAt > lastLoginAt)) {
        lastLoginAt = user.lastLoginAt;
        lastLoginEmail = user.email;
      }
      totalLogins += user.loginCount ?? 0;
    }

    const childStates = await Promise.all(childIds.map((id) => new ChildEntity(c.env, id).getState()));
    const childStatsByParent = new Map<string, { targetCount: number; slotUpdates: number }>();
    for (const child of childStates) {
      const entry = childStatsByParent.get(child.parentId) || { targetCount: 0, slotUpdates: 0 };
      entry.targetCount += child.prizeTargets?.length || 0;
      entry.slotUpdates += child.totalStars + child.totalPerfectDays + child.totalPerfectWeeks;
      childStatsByParent.set(child.parentId, entry);
    }

    const accounts: AdminAccountSummary[] = users.map(user => {
      const childMeta = childStatsByParent.get(user.id) || { targetCount: 0, slotUpdates: 0 };
      return {
        email: user.email,
        lastLoginAt: user.lastLoginAt ?? null,
        loginCount: user.loginCount ?? 0,
        childCount: user.childIds?.length || 0,
        totalPrizeTargets: childMeta.targetCount,
        totalSlotUpdates: childMeta.slotUpdates,
        lastInteractionAt: user.lastInteractionAt ?? null,
      };
    }).sort((a, b) => (b.lastLoginAt ?? 0) - (a.lastLoginAt ?? 0));

    const { items: resetRequestsRaw } = await PasswordResetRequestEntity.list(c.env);
    const { items: feedbackRaw } = await FeedbackMessageEntity.list(c.env);

    const payload: AdminStats = {
      totalAccounts: users.length,
      totalChildren: childIds.length,
      totalSlotUpdates: systemStats.totalSlotUpdates || 0,
      totalLogins,
      lastInteractionAt: systemStats.lastInteractionAt ?? null,
      lastLoginAt,
      lastLoginEmail,
      accounts,
      resetRequests: resetRequestsRaw.sort((a, b) => b.createdAt - a.createdAt),
      feedbackMessages: feedbackRaw.sort((a, b) => b.createdAt - a.createdAt),
    };
    return ok(c, payload);
  });

  app.post('/api/admin/reset-requests/:requestId/resolve', async (c) => {
    requireAdminKey(c);
    const { requestId } = c.req.param();
    const body = await c.req.json<{ newPassword?: string }>();
    if (!isStr(body.newPassword) || body.newPassword.length < 6) {
      return bad(c, 'A new password of at least 6 characters is required.');
    }
    const request = new PasswordResetRequestEntity(c.env, requestId);
    if (!(await request.exists())) {
      return notFound(c, 'Reset request not found.');
    }
    const requestState = await request.getState();
    if (requestState.status === 'completed') {
      return bad(c, 'Reset request has already been completed.');
    }
    const user = new UserEntity(c.env, requestState.email);
    if (!(await user.exists())) {
      return notFound(c, 'User account not found.');
    }
    await user.resetPassword(body.newPassword);
    await request.save({
      ...requestState,
      status: 'completed',
      resolvedAt: Date.now(),
      resolvedBy: 'admin',
    });
    return ok(c, { message: 'Password updated successfully.' });
  });

  app.post('/api/admin/feedback/:feedbackId/read', async (c) => {
    requireAdminKey(c);
    const { feedbackId } = c.req.param();
    const feedback = new FeedbackMessageEntity(c.env, feedbackId);
    if (!(await feedback.exists())) {
      return notFound(c, 'Feedback not found.');
    }
    const state = await feedback.getState();
    await feedback.save({
      ...state,
      status: 'read',
      resolvedAt: Date.now(),
      resolvedBy: 'admin',
    });
    return ok(c, { message: 'Feedback marked as read.' });
  });

  app.route('/api', protectedRoutes);
}
