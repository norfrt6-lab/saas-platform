'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  status: 'active' | 'disabled';
  createdAt: string;
}

const ALL_EVENTS = [
  'project.created', 'project.updated', 'project.deleted',
  'member.invited', 'member.joined', 'member.removed',
  'subscription.created', 'subscription.updated', 'subscription.canceled',
];

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data: endpoints = [], isLoading } = useQuery<WebhookEndpoint[]>({
    queryKey: ['webhooks'],
    queryFn: () => fetch('/api/webhooks').then((r) => r.json()),
  });

  const create = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      setShowForm(false);
      setUrl('');
      setDescription('');
      setSelectedEvents([]);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/webhooks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send real-time events to your endpoints when things happen in your team.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Add endpoint
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-4">New webhook endpoint</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhooks"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="My webhook"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events (leave empty for all)</label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) =>
                        setSelectedEvents(e.target.checked
                          ? [...selectedEvents, event]
                          : selectedEvents.filter((ev) => ev !== event))
                      }
                      className="rounded"
                    />
                    <span className="font-mono text-gray-600">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => create.mutate({ url, description, events: selectedEvents })}
                disabled={!url || create.isPending}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create endpoint'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-white border rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : endpoints.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm text-gray-500">No webhook endpoints yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-gray-900 truncate">{ep.url}</p>
                  {ep.description && <p className="text-xs text-gray-500 mt-0.5">{ep.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(ep.events.length === 0 ? ['all events'] : ep.events).map((ev) => (
                      <span key={ev} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ep.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ep.status}
                  </span>
                  <button
                    onClick={() => toggle.mutate({ id: ep.id, status: ep.status === 'active' ? 'disabled' : 'active' })}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    {ep.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => remove.mutate(ep.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
