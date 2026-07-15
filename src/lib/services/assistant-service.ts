import type { AssistantResponse } from '@/lib/types';
import { SearchService } from '@/lib/services/search-service';
import { miniTranslations } from '@/data/translations-mini';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_GPT4O_MODEL ?? 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/chat/completions';

interface AssistantModelResult {
  answer: string;
  suggestions?: string[];
}

export class AssistantService {
  private searchService = new SearchService();

  async answer(question: string): Promise<AssistantResponse> {
    const trimmed = question.trim();
    if (!trimmed) {
      return {
        answer: 'Please provide a question about Scripture so I can help you explore relevant passages.',
        verses: [],
        suggestions: ['Ask things like “Where does Jesus talk about rest?” or “What verses speak about hope when I feel anxious?”'],
      };
    }

    const matches = this.searchService.searchInTranslations(miniTranslations, trimmed, {
      limit: 5,
      includeContext: true,
    });

    const uniqueVerses = matches.slice(0, 3).map((match) => ({
      book: match.book,
      chapter: match.chapter,
      verse: match.verse,
      text: match.text,
      translationId: match.translationId || miniTranslations[0].id,
    }));

    const modelResponse = await this.generateAssistantAnswer(trimmed, uniqueVerses);
    const answer = modelResponse?.answer ?? this.composeFallbackAnswer(trimmed, uniqueVerses);
    const suggestions = modelResponse?.suggestions?.length ? modelResponse.suggestions : this.buildSuggestions(trimmed);

    return { answer, verses: uniqueVerses, suggestions };
  }

  private async generateAssistantAnswer(
    question: string,
    verses: AssistantResponse['verses']
  ): Promise<AssistantModelResult | null> {
    if (!OPENAI_API_KEY) {
      return null;
    }

    const verseContext =
      verses.length > 0
        ? verses
            .map(
              (verse) =>
                `${verse.book} ${verse.chapter}:${verse.verse} (${verse.translationId}) - ${verse.text}`
            )
            .join('\n')
        : 'No passages were found.';

    const messages = [
      {
        role: 'system',
        content:
          'You are an assistant for a Bible-reading app. Respond concisely with pastoral warmth, grounding every insight in the provided passages. If verses are missing, encourage the reader to study directly from Scripture. Always respond as JSON: {"answer":"string","suggestions":["string"]}.',
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nPassages:\n${verseContext}\n\nReturn JSON with:\n- answer: a short paragraph tying the passages to the question\n- suggestions: 2-3 follow-up questions the user could ask next`,
      },
    ];

    try {
      const response = await fetch(OPENAI_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.2,
          max_tokens: 350,
          messages,
        }),
      });

      if (!response.ok) {
        console.error('AssistantService OpenAI error:', await response.text());
        return null;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;

      try {
        const parsed = JSON.parse(content) as AssistantModelResult;
        if (parsed?.answer) {
          return parsed;
        }
      } catch (error) {
        console.warn('AssistantService: unable to parse model JSON response', error);
        return { answer: content };
      }
    } catch (error) {
      console.error('AssistantService: model call failed', error);
      return null;
    }

    return null;
  }

  private composeFallbackAnswer(question: string, verses: AssistantResponse['verses']): string {
    if (verses.length === 0) {
      return `I could not find a direct verse match for “${question}”. Try rephrasing your question or specifying a theme such as love, peace, or wisdom.`;
    }

    const intro = `Here are verses that speak into “${question}”:`;
    const verseSummaries = verses
      .map(
        (verse) =>
          `${verse.book} ${verse.chapter}:${verse.verse} — ${verse.text.replace(/\s+/g, ' ').trim()}`
      )
      .join(' ');

    return `${intro} ${verseSummaries}`;
  }

  private buildSuggestions(question: string): string[] {
    const baseSuggestions = [
      'Show me passages about hope.',
      'Where does Jesus talk about prayer?',
      'What verses can I read when I feel anxious?',
      'List verses that mention the Holy Spirit.',
    ];

    if (question.toLowerCase().includes('love')) {
      return [
        'Which passages compare God’s love to a shepherd?',
        'Show New Testament verses on loving one another.',
      ];
    }

    if (question.toLowerCase().includes('peace')) {
      return [
        'Verses about peace in the middle of storms?',
        'Where does Paul talk about the peace of God?',
      ];
    }

    return baseSuggestions;
  }
}
