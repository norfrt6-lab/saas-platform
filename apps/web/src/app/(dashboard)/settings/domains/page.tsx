'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed';
  verificationToken: string;
  sslProvisioned: boolean;
  verifiedAt: string | null;
}

const STATUS_STYLES = {
  pending:   'bg-gray-100 text-gray-600',
  verifying: 'bg-yellow-50 text-yellow-700',
  active:    'bg-green-50 text-green-700',
  failed:    'bg-red-50 text-red-600',
};

export default function DomainsPage() {
  const qc = useQueryClient();
  const [input, setInput] = useState('');

  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ['custom-domains'],
    queryFn: () => fetch('/api/domains').then((r) => r.json()),
  });

  const add = useMutation({
    mutationFn: (domain: string) =>
      fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custom-domains'] }); setInput(''); },
  });

  const verify = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/domains/${id}/verify`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-domains'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/domains/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-domains'] }),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Custom Domains</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          White-label your workspace with a custom domain. Add a CNAME record pointing to{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">cname.saasplatform.com</code>.
        </p>
      </div>

      {/* Add domain */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add domain</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="app.yourcompany.com"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={() => add.mutate(input.trim())}
            disabled={!input.trim() || add.isPending}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {add.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Domain list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-white border rounded-xl animate-pulse" />)}
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-sm text-gray-400">
          No custom domains yet.
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-900">{d.domain}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[d.status]}`}>
                      {d.status}
                    </span>
                    {d.sslProvisioned && (
                      <span className="text-xs text-green-600 font-medium">🔒 SSL</span>
                    )}
                  </div>
                  {d.status === 'pending' && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <p className="font-medium mb-1">Add this DNS record:</p>
                      <div className="font-mono space-y-0.5">
                        <p><span className="text-gray-400">Type:</span> CNAME</p>
                        <p><span className="text-gray-400">Name:</span> {d.domain.split('.').slice(0, -2).join('.')}</p>
                        <p><span className="text-gray-400">Value:</span> cname.saasplatform.com</p>
                        <p><span className="text-gray-400">TXT:</span> {d.verificationToken}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {(d.status === 'pending' || d.status === 'failed') && (
                    <button
                      onClick={() => verify.mutate(d.id)}
                      disabled={verify.isPending}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => remove.mutate(d.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
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
