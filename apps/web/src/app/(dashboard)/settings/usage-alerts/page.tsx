'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UsageAlert {
  id: string;
  metric: string;
  thresholdPercent: number;
  notifyEmail: boolean;
  notifyInApp: boolean;
  triggeredAt: string | null;
}

const METRICS = [
  { value: 'api_calls', label: 'API calls' },
  { value: 'storage_gb', label: 'Storage (GB)' },
  { value: 'seats', label: 'Team seats' },
  { value: 'projects', label: 'Projects' },
];

const THRESHOLDS = [50, 75, 90, 100];

export default function UsageAlertsPage() {
  const qc = useQueryClient();
  const [metric, setMetric] = useState('api_calls');
  const [threshold, setThreshold] = useState(80);
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);

  const { data: alerts = [], isLoading } = useQuery<UsageAlert[]>({
    queryKey: ['usage-alerts'],
    queryFn: () => fetch('/api/usage-alerts').then((r) => r.json()),
  });

  const create = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/usage-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage-alerts'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/usage-alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usage-alerts'] }),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Usage Alerts</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Get notified before you hit plan limits.
        </p>
      </div>

      {/* Create alert */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">New alert</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Threshold</label>
            <div className="flex gap-1">
              {THRESHOLDS.map((t) => (
                <button
                  key={t}
                  onClick={() => setThreshold(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    threshold === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="rounded" />
            Email notification
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} className="rounded" />
            In-app notification
          </label>
        </div>

        <button
          onClick={() => create.mutate({ metric, thresholdPercent: threshold, notifyEmail: email, notifyInApp: inApp })}
          disabled={create.isPending}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create alert'}
        </button>
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white border rounded-xl animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-sm text-gray-400">
          No alerts configured.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${alert.thresholdPercent >= 90 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {alert.thresholdPercent >= 90 ? '🚨' : '⚠️'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {METRICS.find((m) => m.value === alert.metric)?.label ?? alert.metric} at {alert.thresholdPercent}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {[alert.notifyEmail && 'email', alert.notifyInApp && 'in-app'].filter(Boolean).join(' + ')}
                    {alert.triggeredAt && ` · Last triggered ${new Date(alert.triggeredAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => remove.mutate(alert.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
