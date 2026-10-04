import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai-client';
import { sql } from '@/lib/db';
import { verifyBearerToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request);
    const body = await request.json();
    const { query, answer, additionalContext, sessionId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI search is not configured' }, { status: 503 });
    }

    const systemPrompt = `The user is clarifying their Bible search. Provide a refined search response. Return JSON:
{
  "answer": "Concise updated answer",
  "results": [
    { "translationId": "kjv", "translationName": "KJV", "book": "John", "chapter": 3, "verse": 16, "text": "..." }
  ],
  "suggestions": ["follow-up 1"]
}`;

    const userPrompt = `Original question: ${query}\nPrevious answer: ${answer || ''}\nAdditional context: ${additionalContext || ''}`;

    const raw = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.6, max_tokens: 1500 }
    );

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
    const parsed = JSON.parse(jsonText);

    const response = {
      answer: parsed.answer || '',
      results: parsed.results || [],
      suggestions: parsed.suggestions || [],
      sessionId: sessionId || null,
    };

    if (sessionId) {
      const now = new Date().toISOString();
      await sql`
        UPDATE bible_search_conversations
        SET answer = ${response.answer},
            results = ${JSON.stringify(response.results)},
            updated_at = ${now}
        WHERE session_id = ${sessionId} AND user_id = ${user.uid}
      `;
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Clarify error:', message);
    return NextResponse.json({ error: 'Clarify request failed', details: message }, { status: 500 });
  }
}
