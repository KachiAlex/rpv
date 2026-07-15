"use client";

import { useState } from 'react';

interface AssistantResponseDto {
  answer: string;
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
    translationId: string;
  }>;
  suggestions: string[];
}

const defaultSuggestions = [
  'Where does Jesus talk about rest?',
  'Verses about trusting God when anxious',
  'Show passages that talk about hope',
];

export function AssistantPanel() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AssistantResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (prompt?: string) => {
    const query = prompt ?? question;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (!res.ok) {
        throw new Error('Unable to reach the assistant.');
      }

      const data = (await res.json()) as AssistantResponseDto;
      setResponse(data);
      setQuestion(prompt ? '' : question);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent-teal">AI Guide</p>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Find supporting verses</h3>
      </div>

      <div className="space-y-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about themes, people, or promises in Scripture..."
          rows={3}
          className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          className="w-full rounded-md bg-gradient-to-r from-brand-600 to-accent-pink text-white py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Ask Assistant'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!response && !loading && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {defaultSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleAsk(suggestion)}
                className="text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {response && (
        <div className="space-y-3">
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/40 p-3 text-sm text-neutral-700 dark:text-neutral-300">
            {response.answer}
          </div>

          {response.verses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Verses</p>
              <div className="space-y-2">
                {response.verses.map((verse) => (
                  <div key={`${verse.book}-${verse.chapter}-${verse.verse}`} className="text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {verse.book} {verse.chapter}:{verse.verse} ({verse.translationId})
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-300">{verse.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {response.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {response.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAsk(suggestion)}
                    className="text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
