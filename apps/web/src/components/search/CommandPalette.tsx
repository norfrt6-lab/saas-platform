'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'project' | 'team' | 'member' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_ICON = {
  project: '📁',
  team: '👥',
  member: '👤',
  page: '📄',
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global cmd+k / ctrl+k
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const { data } = useQuery<{ results: SearchResult[] }>({
    queryKey: ['search', q],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
    enabled: open,
    staleTime: 30_000,
  });

  const results = data?.results ?? [];

  useEffect(() => setCursor(0), [q]);

  function navigate(result: SearchResult) {
    router.push(result.href);
    setOpen(false);
    setQ('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && results[cursor]) {
      navigate(results[cursor]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, teams, members, pages…"
            className="flex-1 text-sm outline-none placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {q ? 'No results' : 'Start typing to search'}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => navigate(r)}
                onMouseEnter={() => setCursor(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  cursor === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{TYPE_ICON[r.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{r.type}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="bg-gray-100 px-1 py-0.5 rounded mr-1">↑↓</kbd>navigate</span>
          <span><kbd className="bg-gray-100 px-1 py-0.5 rounded mr-1">⏎</kbd>select</span>
        </div>
      </div>
    </div>
  );
}
