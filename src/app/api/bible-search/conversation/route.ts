import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai-client';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

function generateSessionId(): string {
  return `bs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDate(date: string): string {
  return date.slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { query, sessionId, translationId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI search is not configured' }, { status: 503 });
    }

    const sid = sessionId || generateSessionId();
    const now = new Date().toISOString();

    let history: { role: string; content: string }[] = [];
    if (sid) {
      const result = await sql`
        SELECT history FROM bible_search_conversations
        WHERE session_id = ${sid} AND user_id = ${user.uid}
        LIMIT 1
      `;
      if (result.rows[0]) {
        history = (result.rows[0].history as { role: string; content: string }[]) || [];
      }
    }

    const systemPrompt = `You are a conversational Bible search assistant. Help the user find verses based on their natural language question. Return JSON:
{
  "answer": "Concise summary of relevant verses",
  "results": [
    { "translationId": "kjv", "translationName": "King James Version", "book": "John", "chapter": 3, "verse": 16, "text": "For God so loved..." }
  ],
  "clarifyingNeeded": false,
  "clarifyingQuestion": "",
  "suggestions": ["follow-up 1", "follow-up 2"]
}

If the query is vague, set clarifyingNeeded to true and provide a clarifyingQuestion.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: query },
    ];

    const raw = await callOpenAI(messages as any, { temperature: 0.6, max_tokens: 1500 });

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
    const parsed = JSON.parse(jsonText);

    const response = {
      answer: parsed.answer || 'Here are some relevant passages.',
      results: parsed.results || [],
      clarifyingNeeded: parsed.clarifyingNeeded || false,
      clarifyingQuestion: parsed.clarifyingQuestion || '',
      suggestions: parsed.suggestions || [],
      sessionId: sid,
    };

    const newHistory = [
      ...history,
      { role: 'user', content: query },
      { role: 'assistant', content: JSON.stringify(response) },
    ];

    await sql`
      INSERT INTO bible_search_conversations (session_id, user_id, query, answer, results, translation_id, history, updated_at, created_at)
      VALUES (${sid}, ${user.uid}, ${query}, ${response.answer}, ${JSON.stringify(response.results)}, ${translationId || null}, ${JSON.stringify(newHistory)}, ${now}, ${now})
      ON CONFLICT (session_id) DO UPDATE SET
        query = EXCLUDED.query,
        answer = EXCLUDED.answer,
        results = EXCLUDED.results,
        translation_id = EXCLUDED.translation_id,
        history = EXCLUDED.history,
        updated_at = EXCLUDED.updated_at
    `;

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Bible search conversation error:', message);
    return NextResponse.json({ error: 'Search conversation failed', details: message }, { status: 500 });
  }
}
