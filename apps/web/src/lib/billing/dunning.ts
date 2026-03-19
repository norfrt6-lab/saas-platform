export interface DunningState {
  tenantId: string;
  subscriptionId: string;
  paymentFailedAt: Date;
  graceEndsAt: Date;
  remindersSent: number;
  lastReminderAt: Date | null;
  status: "in_grace" | "suspended" | "recovered" | "cancelled";
}

const GRACE_PERIOD_DAYS = 7;
const REMINDER_INTERVALS_DAYS = [1, 3, 6];

const dunningStore = new Map<string, DunningState>();

export function startDunning(tenantId: string, subscriptionId: string): DunningState {
  const now = new Date();
  const graceEndsAt = new Date(now);
  graceEndsAt.setDate(graceEndsAt.getDate() + GRACE_PERIOD_DAYS);

  const state: DunningState = {
    tenantId, subscriptionId,
    paymentFailedAt: now, graceEndsAt,
    remindersSent: 0, lastReminderAt: null,
    status: "in_grace",
  };
  dunningStore.set(tenantId, state);
  return state;
}

export function getDunningState(tenantId: string): DunningState | null {
  return dunningStore.get(tenantId) ?? null;
}

export function isInGracePeriod(tenantId: string): boolean {
  const state = dunningStore.get(tenantId);
  if (!state || state.status !== "in_grace") return false;
  return new Date() < state.graceEndsAt;
}

export function shouldSendReminder(state: DunningState): boolean {
  if (state.status !== "in_grace") return false;
  const daysSinceFailure = Math.floor((Date.now() - state.paymentFailedAt.getTime()) / 86400000);
  const nextInterval = REMINDER_INTERVALS_DAYS[state.remindersSent];
  return nextInterval !== undefined && daysSinceFailure >= nextInterval;
}

export function recordReminderSent(tenantId: string): DunningState | null {
  const state = dunningStore.get(tenantId);
  if (!state) return null;
  const updated = { ...state, remindersSent: state.remindersSent + 1, lastReminderAt: new Date() };
  dunningStore.set(tenantId, updated);
  return updated;
}

export function markRecovered(tenantId: string): DunningState | null {
  const state = dunningStore.get(tenantId);
  if (!state) return null;
  const updated = { ...state, status: "recovered" as const };
  dunningStore.set(tenantId, updated);
  return updated;
}

export function suspendTenant(tenantId: string): DunningState | null {
  const state = dunningStore.get(tenantId);
  if (!state) return null;
  const updated = { ...state, status: "suspended" as const };
  dunningStore.set(tenantId, updated);
  console.warn(`Tenant ${tenantId} suspended due to non-payment`);
  return updated;
}

export async function processDunningQueue(): Promise<void> {
  for (const [tenantId, state] of dunningStore.entries()) {
    if (state.status !== "in_grace") continue;
    if (new Date() >= state.graceEndsAt) { suspendTenant(tenantId); continue; }
    if (shouldSendReminder(state)) {
      console.log(`Sending dunning reminder ${state.remindersSent + 1} to tenant ${tenantId}`);
      recordReminderSent(tenantId);
    }
  }
}
