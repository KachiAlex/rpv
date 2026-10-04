import { NextRequest, NextResponse } from 'next/server';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ commentary: [] });
    }

    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get('translationId');
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const verse = searchParams.get('verse');

    if (!translationId || !book || !chapter || !verse) {
      return NextResponse.json({ commentary: [] }, { status: 400 });
    }

    const systemPrompt = `You are a biblical commentary writer. Provide a concise, devotional commentary for the given verse. Return JSON:
{
  "commentary": [
    {
      "id": "unique-id",
      "translationId": "provided",
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "title": "Short title",
      "body": "Commentary text...",
      "sources": ["NIV Study Bible"],
      "tags": ["love", "salvation"]
    }
  ]
}

Provide 1-2 commentary entries. Keep body under 250 words each.`;

    const userPrompt = `Translation: ${translationId}, Book: ${book}, Chapter: ${chapter}, Verse: ${verse}`;

    const raw = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.6, max_tokens: 1200 }
    );

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
    const parsed = JSON.parse(jsonText);

    return NextResponse.json({ commentary: parsed.commentary || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Commentary error:', message);
    return NextResponse.json({ commentary: [] });
  }
}
