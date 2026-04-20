'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface IpEntry {
  id: string;
  cidr: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
}

function isValidCidr(value: string): boolean {
  const clean = value.trim();
  if (!clean) return false;
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?$/;
  const match = clean.match(ipRegex);
  if (!match) return false;

  for (let i = 1; i <= 4; i++) {
    if (parseInt(match[i], 10) > 255) return false;
  }
  if (match[6] !== undefined && parseInt(match[6], 10) > 32) return false;
  return true;
}

export default function IpAllowlistPage() {
  const qc = useQueryClient();
  const [cidr, setCidr] = useState('');
  const [description, setDescription] = useState('');

  const { data: entries = [], isLoading } = useQuery<IpEntry[]>({
    queryKey: ['ip-allowlist'],
    queryFn: () => fetch('/api/ip-allowlist').then((r) => r.json()),
  });

  const { data: currentIp } = useQuery<{ ip: string }>({
    queryKey: ['my-ip'],
    queryFn: () => fetch('/api/my-ip').then((r) => r.json()),
  });

  const add = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/ip-allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ip-allowlist'] });
      setCidr(''); setDescription('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/ip-allowlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ip-allowlist'] }),
  });

  const valid = isValidCidr(cidr);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">IP Allowlist</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Restrict access to your workspace by IP address. Empty list = no restriction.
        </p>
      </div>

      {entries.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-2">
          <span className="text-orange-600">⚠️</span>
          <p className="text-xs text-orange-800">
            IP allowlist is active. Users outside these ranges cannot sign in.
            {currentIp?.ip && <> Your current IP: <code className="font-mono bg-white px-1 rounded">{currentIp.ip}</code></>}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Add IP or CIDR range</h2>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              placeholder="203.0.113.0/24 or 203.0.113.42"
              className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
                cidr && !valid ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-900'
              }`}
            />
            {cidr && !valid && <p className="text-xs text-red-600 mt-1">Invalid IPv4 or CIDR notation.</p>}
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g. Office network)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={() => add.mutate({ cidr, description })}
            disabled={!valid || add.isPending}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {add.isPending ? 'Adding…' : 'Add to allowlist'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white border rounded-xl animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-sm text-gray-400">
          No IP restrictions — all IPs allowed.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-gray-900">{e.cidr}</p>
                {e.description && <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>}
              </div>
              <button
                onClick={() => remove.mutate(e.id)}
                className="text-xs text-red-500 hover:text-red-700 shrink-0"
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
