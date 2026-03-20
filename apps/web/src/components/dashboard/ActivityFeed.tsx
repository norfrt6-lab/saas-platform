"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export interface ActivityEvent {
  id: string;
  actorName: string;
  actorAvatar?: string;
  action: string;
  target: string;
  targetUrl?: string;
  createdAt: string;
  type: "create" | "update" | "delete" | "invite" | "comment";
}

const ACTION_ICONS: Record<ActivityEvent["type"], string> = {
  create: "✨",
  update: "✏️",
  delete: "🗑️",
  invite: "📨",
  comment: "💬",
};

function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <li className="flex gap-3 items-start py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
        {event.actorAvatar ? (
          <img src={event.actorAvatar} alt={event.actorName} className="w-full h-full rounded-full object-cover" />
        ) : (
          event.actorName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{event.actorName}</span>{" "}
          <span className="text-gray-500">{event.action}</span>{" "}
          {event.targetUrl ? (
            <a href={event.targetUrl} className="font-medium text-blue-600 hover:underline truncate">
              {event.target}
            </a>
          ) : (
            <span className="font-medium">{event.target}</span>
          )}
          <span className="ml-1 text-lg" title={event.type}>{ACTION_ICONS[event.type]}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </p>
      </div>
    </li>
  );
}

interface ActivityFeedProps {
  tenantId: string;
  limit?: number;
  pollIntervalMs?: number;
}

export function ActivityFeed({ tenantId, limit = 20, pollIntervalMs = 30_000 }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/activity?tenantId=${tenantId}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, pollIntervalMs);
    return () => clearInterval(interval);
  }, [tenantId, limit, pollIntervalMs]);

  if (loading) return <div className="p-4 text-sm text-gray-500 animate-pulse">Loading activity...</div>;
  if (error) return <div className="p-4 text-sm text-red-500">Error: {error}</div>;
  if (events.length === 0) return <div className="p-4 text-sm text-gray-400">No recent activity.</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-gray-50 px-4">
        {events.map((event) => (
          <ActivityItem key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}

export default ActivityFeed;
