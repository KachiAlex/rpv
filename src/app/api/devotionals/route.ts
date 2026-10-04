import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ devotional: null }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a devotional writer. Write a daily devotional for the given date. Return JSON:
{
  "devotional": {
    "id": "date-string",
    "date": "2024-01-01",
    "title": "Devotional title",
    "summary": "One sentence summary",
    "body": "Devotional content...",
    "scriptures": [
      { "book": "Psalms", "chapter": 23, "verseStart": 1, "verseEnd": 6 }
    ],
    "reflectionQuestions": ["Question 1", "Question 2"],
    "prayerFocus": "Prayer focus text"
  }
}

Body should be 300-500 words. Include 2-3 reflection questions.`;

    const userPrompt = `Write a devotional for ${date}. Theme it around the season if applicable.`;

    const raw = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, max_tokens: 1500 }
    );

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
    const parsed = JSON.parse(jsonText);

    if (!parsed.devotional) {
      return NextResponse.json({ devotional: null }, { status: 404 });
    }

    return NextResponse.json({ devotional: parsed.devotional });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Devotional error:', message);
    return NextResponse.json({ devotional: null }, { status: 500 });
  }
}
