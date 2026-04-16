'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SsoConfig {
  id: string;
  provider: 'saml' | 'oidc';
  enabled: boolean;
  enforced: boolean;
  allowedDomains: string[];
  entryPoint?: string;
  issuer?: string;
}

export default function SsoPage() {
  const qc = useQueryClient();
  const [provider, setProvider] = useState<'saml' | 'oidc'>('saml');
  const [entryPoint, setEntryPoint] = useState('');
  const [issuer, setIssuer] = useState('');
  const [certificate, setCertificate] = useState('');
  const [domains, setDomains] = useState('');

  const { data: config, isLoading } = useQuery<SsoConfig | null>({
    queryKey: ['sso-config'],
    queryFn: () => fetch('/api/sso').then((r) => r.json()),
  });

  const save = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/sso', {
        method: config ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso-config'] }),
  });

  const toggleEnforced = useMutation({
    mutationFn: (enforced: boolean) =>
      fetch('/api/sso/enforce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enforced }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso-config'] }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-white rounded-xl border" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Single Sign-On</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure SAML 2.0 or OIDC SSO for your team. Requires an Enterprise plan.
        </p>
      </div>

      {config?.enabled && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">SSO is active</p>
            <p className="text-xs text-green-600 mt-0.5">
              Provider: {config.provider.toUpperCase()} · Domains: {config.allowedDomains.join(', ') || 'any'}
            </p>
          </div>
          <button
            onClick={() => toggleEnforced.mutate(!config.enforced)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              config.enforced
                ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {config.enforced ? 'SSO enforced' : 'Enforce SSO'}
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex gap-3 mb-6">
          {(['saml', 'oidc'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                provider === p
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {provider === 'saml' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Identity Provider SSO URL</label>
                <input
                  type="url"
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  placeholder="https://idp.example.com/saml/sso"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID / Issuer</label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="https://idp.example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">X.509 Certificate</label>
                <textarea
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">OIDC configuration coming soon.</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allowed email domains <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="example.com, corp.example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() =>
                save.mutate({
                  provider,
                  entryPoint,
                  issuer,
                  certificate,
                  allowedDomains: domains.split(',').map((d) => d.trim()).filter(Boolean),
                })
              }
              disabled={save.isPending}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save configuration'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Service Provider metadata</h3>
        <p className="text-xs text-gray-500 mb-3">Configure these values in your identity provider.</p>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex gap-2">
            <span className="text-gray-500 w-32 shrink-0">ACS URL</span>
            <span className="text-gray-800">{typeof window !== 'undefined' ? `${window.location.origin}/api/sso/saml/callback` : ''}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-32 shrink-0">Entity ID</span>
            <span className="text-gray-800">{typeof window !== 'undefined' ? `${window.location.origin}/api/sso/saml/metadata` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
