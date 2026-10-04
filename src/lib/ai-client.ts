import { getDb } from './db';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenAI(messages: OpenAIMessage[], options?: { temperature?: number; max_tokens?: number }): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch(OPENAI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content?.trim() || '';
}

export async function fetchVerseText(translationId: string, book: string, chapter: number, verse: number): Promise<string | null> {
  try {
    const db = getDb();
    const result = await db.query(
      `SELECT text FROM verses
       WHERE translation_id = $1 AND book = $2 AND chapter = $3 AND verse = $4
       LIMIT 1`,
      [translationId, book, chapter, verse]
    );
    return result.rows[0]?.text || null;
  } catch {
    return null;
  }
}
