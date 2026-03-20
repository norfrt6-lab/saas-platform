import { db } from "@saas/db";
import { notifications } from "@saas/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string().cuid(),
  tenantId: z.string().cuid(),
  type: z.enum(["info", "warning", "error", "success"]),
  channel: z.enum(["in_app", "email", "both"]),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1000),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type NotificationPayload = z.infer<typeof notificationSchema>;

interface QueuedNotification extends NotificationPayload {
  id: string;
  createdAt: Date;
  readAt: Date | null;
  attempts: number;
}

const notificationQueue: QueuedNotification[] = [];

export async function enqueueNotification(
  payload: NotificationPayload
): Promise<string> {
  const parsed = notificationSchema.parse(payload);
  const id = crypto.randomUUID();

  notificationQueue.push({
    ...parsed,
    id,
    createdAt: new Date(),
    readAt: null,
    attempts: 0,
  });

  await processQueue();
  return id;
}

async function processQueue(): Promise<void> {
  const pending = notificationQueue.filter((n) => n.attempts < 3);

  for (const notification of pending) {
    try {
      notification.attempts += 1;

      if (
        notification.channel === "in_app" ||
        notification.channel === "both"
      ) {
        await deliverInApp(notification);
      }

      if (notification.channel === "email" || notification.channel === "both") {
        await deliverEmail(notification);
      }

      const idx = notificationQueue.indexOf(notification);
      if (idx !== -1) notificationQueue.splice(idx, 1);
    } catch (err) {
      console.error(`Notification delivery failed [${notification.id}]:`, err);
    }
  }
}

async function deliverInApp(n: QueuedNotification): Promise<void> {
  await db.insert(notifications).values({
    id: n.id,
    userId: n.userId,
    tenantId: n.tenantId,
    type: n.type,
    title: n.title,
    body: n.body,
    actionUrl: n.actionUrl ?? null,
    metadata: n.metadata ? JSON.stringify(n.metadata) : null,
    readAt: null,
    createdAt: n.createdAt,
  });
}

async function deliverEmail(n: QueuedNotification): Promise<void> {
  // Email delivery is handled by the email template service
  console.info(`[email] Sending "${n.title}" to user ${n.userId}`);
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function listNotifications(
  userId: string,
  limit = 20
): Promise<QueuedNotification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows as unknown as QueuedNotification[];
}
