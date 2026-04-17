'use client';

import { useState } from 'react';

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [erasing, setErasing] = useState(false);
  const [eraseScheduled, setEraseScheduled] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch('/api/gdpr/export', { method: 'POST' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function requestErasure() {
    setErasing(true);
    try {
      const res = await fetch('/api/gdpr/erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const data = await res.json();
      if (res.ok) {
        setEraseScheduled(new Date(data.deletionDate).toLocaleDateString());
      }
    } finally {
      setErasing(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Privacy & Data</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal data in compliance with GDPR.</p>
      </div>

      {/* Data export */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Export your data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download a copy of all your personal data including your profile, teams, projects, and activity log.
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {exporting ? 'Preparing export…' : 'Download my data'}
        </button>
      </div>

      {/* Erasure */}
      <div className="bg-white border border-red-100 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Delete your account</h2>
        <p className="text-sm text-gray-500 mb-4">
          Your account will be anonymised immediately and permanently deleted after a 30-day grace period.
          This action cannot be undone.
        </p>

        {eraseScheduled ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Account deletion scheduled for <strong>{eraseScheduled}</strong>. Contact support to cancel.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type <code className="bg-gray-100 px-1 rounded">DELETE MY ACCOUNT</code> to confirm
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={requestErasure}
              disabled={confirmation !== 'DELETE MY ACCOUNT' || erasing}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {erasing ? 'Scheduling deletion…' : 'Delete my account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
