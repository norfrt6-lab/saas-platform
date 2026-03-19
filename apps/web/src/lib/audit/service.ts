import { getTenantContext } from "@/lib/tenant/context";

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.invited"
  | "user.role_changed"
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "project.restored"
  | "team.created"
  | "team.updated"
  | "team.member_added"
  | "team.member_removed"
  | "billing.subscription_changed"
  | "api_key.created"
  | "api_key.revoked"
  | "settings.updated";

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  actorEmail?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditQuery {
  action?: AuditAction;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  before?: Date;
  after?: Date;
  limit?: number;
  cursor?: string;
}

// Append-only log: never allow updates or deletes
const auditLog: AuditEvent[] = [];

export async function logAuditEvent(
  action: AuditAction,
  opts: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    actorEmail?: string;
  } = {},
): Promise<AuditEvent> {
  const { tenantId, userId } = getTenantContext();

  const event: AuditEvent = {
    id: crypto.randomUUID(),
    tenantId,
    actorId: userId,
    actorEmail: opts.actorEmail,
    action,
    resourceType: opts.resourceType,
    resourceId: opts.resourceId,
    metadata: opts.metadata,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    createdAt: new Date(),
  };

  // Immutable: push only, no mutation allowed
  auditLog.push(Object.freeze(event));
  return event;
}

export async function queryAuditLog(
  query: AuditQuery = {},
): Promise<{ events: AuditEvent[]; nextCursor: string | null }> {
  const { tenantId } = getTenantContext();
  const limit = Math.min(query.limit ?? 50, 200);

  let filtered = auditLog
    .filter((e) => e.tenantId === tenantId)
    .filter((e) => !query.action || e.action === query.action)
    .filter((e) => !query.actorId || e.actorId === query.actorId)
    .filter((e) => !query.resourceType || e.resourceType === query.resourceType)
    .filter((e) => !query.resourceId || e.resourceId === query.resourceId)
    .filter((e) => !query.after || e.createdAt >= query.after)
    .filter((e) => !query.before || e.createdAt <= query.before)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (query.cursor) {
    const idx = filtered.findIndex((e) => e.id === query.cursor);
    if (idx !== -1) filtered = filtered.slice(idx + 1);
  }

  const page = filtered.slice(0, limit);
  const nextCursor = filtered.length > limit ? page[page.length - 1]?.id ?? null : null;
  return { events: page, nextCursor };
}
