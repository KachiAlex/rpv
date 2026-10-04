import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI assistant is not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful Bible study assistant. Answer the user's question using biblical wisdom. Provide a concise answer (under 300 words), list any relevant verse references, and suggest 2-3 follow-up questions.

Return JSON in this exact format:
{
  "answer": "string",
  "verses": [
    { "book": "John", "chapter": 3, "verse": 16, "text": "For God so loved..." }
  ],
  "suggestions": ["question 1", "question 2"]
}

For the verse text, include the most relevant short excerpt. If you are not sure, be honest and say so.`;

    const raw = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      { temperature: 0.6, max_tokens: 1200 }
    );

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      answer: parsed.answer || raw,
      verses: parsed.verses || [],
      suggestions: parsed.suggestions || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Assistant error:', message);
    return NextResponse.json({ error: 'Assistant request failed', details: message }, { status: 500 });
  }
}
