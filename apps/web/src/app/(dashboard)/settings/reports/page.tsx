'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Report {
  id: string;
  name: string;
  type: 'usage_summary' | 'billing_summary' | 'team_activity' | 'project_overview';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastSentAt: string | null;
  nextRunAt: string;
}

const TYPE_LABEL = {
  usage_summary: 'Usage Summary',
  billing_summary: 'Billing Summary',
  team_activity: 'Team Activity',
  project_overview: 'Project Overview',
};

export default function ReportsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<Report['type']>('usage_summary');
  const [frequency, setFrequency] = useState<Report['frequency']>('weekly');
  const [recipients, setRecipients] = useState('');

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['scheduled-reports'],
    queryFn: () => fetch('/api/reports').then((r) => r.json()),
  });

  const create = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setName(''); setRecipients('');
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-reports'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/reports/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-reports'] }),
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Scheduled Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Get automated email reports on your team's activity and usage.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">New report</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly team digest"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-colors ${
                    frequency === f
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Report type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Report['type'])}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Recipients (comma-separated)</label>
          <input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="team@company.com, ceo@company.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          onClick={() =>
            create.mutate({
              name,
              type,
              frequency,
              recipients: recipients.split(',').map((e) => e.trim()).filter(Boolean),
            })
          }
          disabled={!name || create.isPending}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Schedule report'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white border rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-sm text-gray-400">
          No scheduled reports.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {r.frequency}
                    </span>
                    {!r.enabled && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {TYPE_LABEL[r.type]} · {r.recipients.length} recipient{r.recipients.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Next run: {new Date(r.nextRunAt).toLocaleString()}
                    {r.lastSentAt && ` · Last sent ${new Date(r.lastSentAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => toggle.mutate({ id: r.id, enabled: !r.enabled })}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    {r.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => remove.mutate(r.id)}
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
