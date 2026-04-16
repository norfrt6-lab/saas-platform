'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTeam } from '@/hooks/use-team';

interface UsagePoint { date: string; total: number }
interface ActivityRow { action: string; count: number }
interface AnalyticsData {
  projects: number;
  usage: UsagePoint[];
  activity: ActivityRow[];
  range: number;
}

const RANGES = [7, 30, 90] as const;

function Sparkline({ data }: { data: UsagePoint[] }) {
  if (data.length < 2) return <div className="h-16 flex items-center text-xs text-gray-400">No data</div>;

  const values = data.map((d) => Number(d.total));
  const max = Math.max(...values, 1);
  const w = 300;
  const h = 64;
  const step = w / (values.length - 1);

  const points = values
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const { team } = useTeam();
  const [range, setRange] = useState<typeof RANGES[number]>(30);

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['team-analytics', team?.id, range],
    queryFn: () =>
      fetch(`/api/analytics/team?teamId=${team?.id}&range=${range}`).then((r) => r.json()),
    enabled: !!team?.id,
  });

  const totalUsage = data?.usage.reduce((s, d) => s + Number(d.total), 0) ?? 0;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Projects', value: isLoading ? '—' : data?.projects ?? 0 },
          { label: `Usage (${range}d)`, value: isLoading ? '—' : totalUsage.toLocaleString() },
          { label: 'Event types', value: isLoading ? '—' : data?.activity.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Usage chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Usage over time</h2>
        {isLoading ? (
          <div className="h-16 bg-gray-50 rounded animate-pulse" />
        ) : (
          <Sparkline data={data?.usage ?? []} />
        )}
      </div>

      {/* Top activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Top activity</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : (data?.activity.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No activity in this period.</p>
        ) : (
          <div className="space-y-2">
            {data?.activity.map((row) => {
              const max = data.activity[0]?.count ?? 1;
              const pct = (row.count / max) * 100;
              return (
                <div key={row.action} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-600 w-48 truncate">{row.action}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{row.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
