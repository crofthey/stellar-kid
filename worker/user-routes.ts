import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import type { Env } from './core-utils';
import { UserEntity, ChildEntity, ChartWeekEntity } from "./entities";
import { ok, bad, isStr, Index, notFound } from './core-utils';
import { hashPassword, verifyPassword, signToken, authMiddleware } from './auth';
import type { SlotState, Child, UserResponse, PrizeTarget, DayState } from "@shared/types";
type AuthVariables = {
    user: UserEntity;
};
const isDayPerfect = (dayState: DayState | undefined): boolean => {
  return !!dayState && dayState.length === 3 && dayState.every((slot) => slot === 'star');
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
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
      return ok(c, { message: 'If a user with that email exists, a reset token has been generated.' });
    }
    const resetToken = await user.setPasswordResetToken();
    console.log(`Password reset token for ${emailKey}: ${resetToken}`);
    return ok(c, { resetToken, message: 'Password reset token generated.' });
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
    const { dayIndex, slotIndex, state: newState } = await c.req.json<{ dayIndex: number; slotIndex: number; state: SlotState }>();
    if (dayIndex === undefined || slotIndex === undefined || !newState) {
      return bad(c, 'Missing dayIndex, slotIndex, or state');
    }
    const chartWeek = new ChartWeekEntity(c.env, weekId);
    const oldWeekState = await chartWeek.getState();
    const oldSlotState = oldWeekState.data[dayIndex]?.[slotIndex] || 'empty';
    const wasDayPerfectBefore = isDayPerfect(oldWeekState.data[dayIndex]);
    const updatedWeek = await chartWeek.updateSlot(dayIndex, slotIndex, newState);
    const isDayPerfectAfter = isDayPerfect(updatedWeek.data[dayIndex]);
    let starDelta = 0;
    if (oldSlotState !== 'star' && newState === 'star') starDelta = 1;
    else if (oldSlotState === 'star' && newState !== 'star') starDelta = -1;
    let perfectDayDelta = 0;
    if (!wasDayPerfectBefore && isDayPerfectAfter) perfectDayDelta = 1;
    else if (wasDayPerfectBefore && !isDayPerfectAfter) perfectDayDelta = -1;
    let updatedChild: Child | undefined;
    if (starDelta !== 0 || perfectDayDelta !== 0) {
        const child = new ChildEntity(c.env, childId);
        updatedChild = await child.updateStats(starDelta, perfectDayDelta);
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
  // --- CHILD-SPECIFIC PRIZE TARGET ROUTES ---
  protectedRoutes.post('/children/:childId/targets', async (c) => {
    const { childId } = c.req.param();
    const body = await c.req.json<{ name?: string; type?: 'stars' | 'days'; targetCount?: number }>();
    if (!isStr(body.name)) {
        return bad(c, 'Prize name must be a non-empty string.');
    }
    if (!body.type || !['stars', 'days'].includes(body.type)) {
        return bad(c, 'Invalid goal type. Must be "stars" or "days".');
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

  app.route('/api', protectedRoutes);
}
