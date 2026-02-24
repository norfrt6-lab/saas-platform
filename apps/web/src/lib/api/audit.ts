import { db } from "@saas/db";
import { auditLogs } from "@saas/db/schema";
import { eq, and, desc, lt } from "drizzle-orm";

export type AuditAction =
  | "team.created"
  | "team.updated"
  | "team.deleted"
  | "member.invited"
  | "member.joined"
  | "member.removed"
  | "member.role_changed"
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "project.restored"
  | "api_key.created"
  | "api_key.revoked"
  | "billing.plan_changed"
  | "billing.payment_failed"
  | "auth.login"
  | "auth.logout"
  | "auth.password_changed"
  | "settings.updated";

export async function createAuditLog(params: {
  teamId: string;
  userId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(auditLogs).values({
    teamId: params.teamId,
    userId: params.userId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata ?? {},
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  });
}

export async function getAuditLogs(params: {
  teamId: string;
  cursor?: string;
  limit?: number;
  action?: AuditAction;
}) {
  const { teamId, cursor, limit = 50, action } = params;

  const conditions = [eq(auditLogs.teamId, teamId)];

  if (cursor) {
    conditions.push(lt(auditLogs.id, cursor));
  }

  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }

  const items = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return { data, nextCursor, hasMore };
}
