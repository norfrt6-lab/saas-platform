'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TotpSetup {
  secret: string;
  uri: string;
  backupCodes: string[];
}

interface Status {
  enabled: boolean;
  lastUsedAt: string | null;
}

export default function SecurityPage() {
  const qc = useQueryClient();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const { data: status } = useQuery<Status>({
    queryKey: ['2fa-status'],
    queryFn: () => fetch('/api/2fa/status').then((r) => r.json()),
  });

  async function startSetup() {
    setError('');
    const res = await fetch('/api/2fa/setup', { method: 'POST' });
    setSetup(await res.json());
  }

  const verify = useMutation({
    mutationFn: (body: { code: string }) =>
      fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.verified) {
        setSetup(null);
        setCode('');
        qc.invalidateQueries({ queryKey: ['2fa-status'] });
      } else {
        setError('Invalid code. Try again.');
      }
    },
  });

  const disable = useMutation({
    mutationFn: () => fetch('/api/2fa/disable', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['2fa-status'] }),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Security</h1>
        <p className="text-sm text-gray-500 mt-0.5">Protect your account with two-factor authentication.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Authenticator app</h2>
            <p className="text-sm text-gray-500 mt-0.5">Use Google Authenticator, 1Password, or any TOTP app.</p>
          </div>
          {status?.enabled ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 shrink-0">
              Enabled
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
              Disabled
            </span>
          )}
        </div>

        {!status?.enabled && !setup && (
          <button
            onClick={startSetup}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            Enable 2FA
          </button>
        )}

        {setup && (
          <div className="space-y-4 border-t border-gray-100 pt-4 mt-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">1. Scan this QR code with your authenticator app:</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.uri)}`}
                alt="2FA QR code"
                className="border rounded-lg"
              />
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">Can't scan? Enter this code manually</summary>
                <code className="block mt-1 text-xs bg-gray-100 p-2 rounded font-mono break-all">{setup.secret}</code>
              </details>
            </div>

            <div>
              <p className="text-sm text-gray-700 mb-2">2. Save these backup codes (you'll see them only once):</p>
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                {setup.backupCodes.map((bc) => (
                  <span key={bc}>{bc}</span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">3. Enter the 6-digit code to verify:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={() => verify.mutate({ code })}
                  disabled={code.length !== 6 || verify.isPending}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {verify.isPending ? 'Verifying…' : 'Verify & enable'}
                </button>
              </div>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
          </div>
        )}

        {status?.enabled && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            {status.lastUsedAt && (
              <p className="text-xs text-gray-500 mb-3">
                Last used {new Date(status.lastUsedAt).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => disable.mutate()}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
