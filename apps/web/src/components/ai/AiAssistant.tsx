'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  teamId?: string;
}

export function AiAssistant({ teamId }: AiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const allMessages = [...messages, userMessage];

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, teamId }),
      });

      if (!res.ok || !res.body) throw new Error('AI request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            assistantContent += delta;

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
              return updated;
            });
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-xl z-50"
        aria-label="Open AI assistant"
      >
        ✦
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-8">
                <p className="text-2xl mb-2">✦</p>
                <p className="text-sm text-gray-500">How can I help you today?</p>
                <div className="mt-4 space-y-2">
                  {[
                    'How do I invite a team member?',
                    'How does billing work?',
                    'How do I create a project?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="block w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] text-sm rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content || (loading && i === messages.length - 1 ? '…' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask anything…"
                disabled={loading}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-3 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
