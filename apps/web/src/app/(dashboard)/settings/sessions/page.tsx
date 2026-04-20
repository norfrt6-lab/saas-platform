'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: { browser: string; os: string; device: 'desktop' | 'mobile' | 'tablet' };
  expiresAt: string;
  current: boolean;
}

const DEVICE_ICON = { desktop: '💻', mobile: '📱', tablet: '📲' };

export default function SessionsPage() {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => fetch('/api/sessions').then((r) => r.json()),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const revokeAll = useMutation({
    mutationFn: () =>
      fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: () => window.location.href = '/login',
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Active Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Devices currently signed in to your account.</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={() => {
              if (confirm('Sign out of all sessions including this one?')) revokeAll.mutate();
            }}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Sign out of all sessions
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-white border rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{DEVICE_ICON[s.userAgent.device]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">
                        {s.userAgent.browser} on {s.userAgent.os}
                      </p>
                      {s.current && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.ipAddress ?? 'Unknown IP'} · Expires {new Date(s.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke.mutate(s.id)}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
