'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

const STEPS: Omit<ChecklistStep, 'completed'>[] = [
  { id: 'profile', title: 'Complete your profile', description: 'Add your name and avatar.', href: '/settings/profile' },
  { id: 'invite', title: 'Invite a team member', description: 'Collaboration starts here.', href: '/settings/members' },
  { id: 'project', title: 'Create your first project', description: 'Organise your work.', href: '/projects/new' },
  { id: 'billing', title: 'Set up billing', description: 'Upgrade to unlock advanced features.', href: '/settings/billing' },
  { id: 'webhook', title: 'Connect a webhook', description: 'Get real-time events in your tools.', href: '/settings/webhooks' },
];

export function OnboardingChecklist({ teamId }: { teamId: string }) {
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data: completedIds = [] } = useQuery<string[]>({
    queryKey: ['onboarding', teamId],
    queryFn: () => fetch(`/api/onboarding?teamId=${teamId}`).then((r) => r.json()),
  });

  const complete = useMutation({
    mutationFn: (stepId: string) =>
      fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, stepId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding', teamId] }),
  });

  const steps: ChecklistStep[] = STEPS.map((s) => ({
    ...s,
    completed: completedIds.includes(s.id),
  }));

  const doneCount = steps.filter((s) => s.completed).length;
  const allDone = doneCount === steps.length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (dismissed || allDone) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Get started</h2>
          <p className="text-xs text-gray-500 mt-0.5">{doneCount} of {steps.length} steps complete</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.completed ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <button
              onClick={() => !step.completed && complete.mutate(step.id)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                step.completed
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {step.completed && <span className="text-xs">✓</span>}
            </button>
            <div className="min-w-0 flex-1">
              <Link href={step.href} className="block">
                <p className={`text-sm font-medium ${step.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </Link>
            </div>
            {!step.completed && (
              <span className="text-gray-300 shrink-0">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
