"use client";
import { useEffect, useState, useCallback } from 'react';
import { useBibleStore } from '@/lib/store';
import { Mic, MicOff, Send, BookOpen, ChevronLeft, ChevronRight, MonitorX } from 'lucide-react';
import { VoiceRecognition, parseBibleReference } from '@/lib/utils/voice-recognition';
import type { Reference } from '@/lib/types';

// Shared with the projector page so both remember the same channel.
const CHANNEL_KEY = 'rpv:projector:channel';
const sanitizeChannel = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

export default function RemotePage() {
  const { translations, current, loadSample, loadTranslations, setCurrent, sendToProjector, blankProjector, setChannelId, loadBookContent } = useBibleStore();
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [endVerse, setEndVerse] = useState<number | ''>('');
  const [channel, setChannel] = useState('default');
  const [voiceRecognition] = useState(() => new VoiceRecognition());
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [recentVerses, setRecentVerses] = useState<Reference[]>([]);
  const [sendError, setSendError] = useState('');

  // Restore persisted channel + recents once on mount
  useEffect(() => {
    const saved = localStorage.getItem(CHANNEL_KEY);
    if (saved) setChannel(sanitizeChannel(saved) || 'default');
    const recent = localStorage.getItem('rpv:recentVerses');
    if (recent) {
      try { setRecentVerses(JSON.parse(recent)); } catch {}
    }
  }, []);

  useEffect(() => {
    loadTranslations().catch(async () => {
      await loadSample();
    });
  }, [loadTranslations, loadSample]);

  // Debounce channel changes — setChannelId resubscribes the listener.
  useEffect(() => {
    const t = setTimeout(() => {
      setChannelId(channel || 'default');
      localStorage.setItem(CHANNEL_KEY, channel || 'default');
    }, 400);
    return () => clearTimeout(t);
  }, [channel, setChannelId]);

  // The translation list is metadata-only — fetch the selected book's real
  // chapters/verses so the dropdowns and send-text lookup work.
  useEffect(() => {
    if (current && book) {
      loadBookContent(current.id, book).catch(() => {});
    }
  }, [current?.id, book, loadBookContent]);

  const handleSendToProjector = useCallback(async (ref: Reference) => {
    setSendError('');
    try {
      await sendToProjector(ref);

      const updated = [ref, ...recentVerses.filter(r =>
        !(r.book === ref.book && r.chapter === ref.chapter && r.verse === ref.verse && r.endVerse === ref.endVerse)
      )].slice(0, 5);
      setRecentVerses(updated);
      localStorage.setItem('rpv:recentVerses', JSON.stringify(updated));

      setBook(ref.book);
      setChapter(ref.chapter);
      setVerse(ref.verse);
      setEndVerse(ref.endVerse ?? '');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send — check connection and that the verse exists.');
    }
  }, [sendToProjector, recentVerses]);

  const handleVoiceResult = useCallback((text: string) => {
    console.log('[Remote] Voice result received:', text);
    setVoiceText(`Heard: "${text}"`);
    const parsed = parseBibleReference(text);
    console.log('[Remote] Parsed result:', parsed);
    
    if (parsed.book && parsed.chapter && parsed.verse) {
      setBook(parsed.book);
      setChapter(parsed.chapter);
      setVerse(parsed.verse);
      setVoiceText(`✓ ${parsed.book} ${parsed.chapter}:${parsed.verse} (confidence: ${Math.round(parsed.confidence * 100)}%)`);
      
      // Auto-send if confidence is reasonable (lowered threshold)
      if (parsed.confidence >= 0.6) {
        setTimeout(() => {
          handleSendToProjector({ book: parsed.book!, chapter: parsed.chapter!, verse: parsed.verse! });
        }, 200);
      } else {
        // Still update the form even if confidence is lower
        console.log(`Parsed with confidence ${parsed.confidence}, updating form but not auto-sending`);
        setVoiceText(`Found: ${parsed.book} ${parsed.chapter}:${parsed.verse} (low confidence - click Send to confirm)`);
      }
    } else {
      // Show what was heard and suggest formats
      console.warn(`Could not parse reference from: "${text}"`);
      setVoiceText(`Could not parse: "${text}". Try: "John 3:16" or "John 3 16" or "John chapter 3 verse 16"`);
      setTimeout(() => setVoiceText(''), 5000);
    }
  }, [handleSendToProjector]);

  const toggleVoiceRecognition = useCallback(async () => {
    if (isListening) {
      voiceRecognition.stop();
      setIsListening(false);
      setVoiceText('');
    } else {
      // Check if voice recognition is available
      if (!voiceRecognition.isAvailable()) {
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      setIsListening(true);
      setVoiceText('Requesting microphone access...');
      
      try {
        await voiceRecognition.start(
          (text) => {
            handleVoiceResult(text);
            setIsListening(false);
          },
          (error) => {
            console.error('[Remote] Voice recognition error:', error);
            setVoiceText(`Error: ${error.message}`);
            setIsListening(false);
            // Show error for a few seconds
            setTimeout(() => setVoiceText(''), 5000);
          }
        );
        setVoiceText('🎤 Listening... Speak now');
      } catch (error) {
        console.error('[Remote] Failed to start voice recognition:', error);
        setIsListening(false);
        setVoiceText(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setVoiceText(''), 5000);
      }
    }
  }, [isListening, voiceRecognition, handleVoiceResult]);

  const books = current?.books || [];
  const chapters = books.find(b => b.name === book)?.chapters || [];
  const verses = chapters.find(c => c.number === chapter)?.verses || [];
  const maxVerse = verses.length ? Math.max(...verses.map(v => v.number)) : 0;

  // Step to the previous/next verse and project it immediately — the normal
  // "advance slides" action during a reading.
  const stepVerse = useCallback((delta: number) => {
    const next = verse + delta;
    if (next < 1 || (delta > 0 && maxVerse > 0 && next > maxVerse)) return;
    setVerse(next);
    setEndVerse('');
    handleSendToProjector({ book, chapter, verse: next });
  }, [verse, maxVerse, book, chapter, handleSendToProjector]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent">
          Remote Controller
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Select a verse or use voice commands to project Bible verses
        </p>
      </div>

      {/* Channel Selection */}
      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
        <label className="block text-sm font-medium mb-2">Channel</label>
        <input
          className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple"
          value={channel}
          onChange={(e) => setChannel(sanitizeChannel(e.target.value))}
          placeholder="default"
        />
        <p className="text-xs text-neutral-500 mt-1">Match this channel on the projector screen — letters, numbers, - and _ only</p>
      </div>

      {/* Translation Selection */}
      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
        <label className="block text-sm font-medium mb-2">Translation</label>
        <select 
          className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple" 
          value={current?.id ?? ''} 
          onChange={(e) => setCurrent(e.target.value)}
        >
          {translations.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Voice Recognition */}
      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 dark:from-accent-purple/20 dark:to-accent-pink/20 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoiceRecognition}
            disabled={!voiceRecognition.isAvailable()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:from-accent-purple/90 hover:to-accent-pink/90'
            } ${!voiceRecognition.isAvailable() ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {isListening ? 'Stop Listening' : 'Voice Command'}
          </button>
          {voiceText && (
            <span className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
              {voiceText}
            </span>
          )}
        </div>
        {!voiceRecognition.isAvailable() && (
          <p className="text-xs text-neutral-500 mt-2">
            Voice recognition not available in this browser. Use Chrome, Edge, or Safari.
          </p>
        )}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
          Try saying: "John 3:16" or "John chapter 3 verse 16"
        </p>
      </div>

      {/* Verse Selection */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
          <label className="block text-sm font-medium mb-2">Book</label>
          <select 
            className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple" 
            value={book} 
            onChange={(e) => setBook(e.target.value)}
          >
            {books.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
          <label className="block text-sm font-medium mb-2">Chapter</label>
          <select 
            className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple" 
            value={chapter} 
            onChange={(e) => {
              setChapter(Number(e.target.value));
              setVerse(1);
            }}
          >
            {chapters.map((c) => (
              <option key={c.number} value={c.number}>Chapter {c.number}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
          <label className="block text-sm font-medium mb-2">Verse</label>
          <select
            className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple"
            value={verse}
            onChange={(e) => { setVerse(Number(e.target.value)); setEndVerse(''); }}
          >
            {verses.map((v) => (
              <option key={v.number} value={v.number}>Verse {v.number}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
          <label className="block text-sm font-medium mb-2">Through (optional)</label>
          <select
            className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple"
            value={endVerse}
            onChange={(e) => setEndVerse(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Single verse</option>
            {verses.filter(v => v.number > verse).map((v) => (
              <option key={v.number} value={v.number}>to {v.number}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview and Send */}
      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {book} {chapter}:{verse}{endVerse ? `-${endVerse}` : ''}
            </p>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
              {verses
                .filter(v => v.number >= verse && v.number <= (endVerse || verse))
                .map(v => v.text)
                .join(' ') || 'Select a verse'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="p-3 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
              onClick={() => stepVerse(-1)}
              title="Previous verse"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="p-3 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
              onClick={() => stepVerse(1)}
              title="Next verse"
            >
              <ChevronRight size={20} />
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-accent-purple text-white font-medium hover:from-brand-700 hover:to-accent-purple/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              onClick={() => handleSendToProjector({ book, chapter, verse, ...(endVerse ? { endVerse } : {}) })}
            >
              <Send size={20} />
              Send
            </button>
            <button
              className="p-3 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              onClick={() => blankProjector().catch(() => setSendError('Could not blank the screen — check connection.'))}
              title="Blank screen"
            >
              <MonitorX size={20} />
            </button>
          </div>
        </div>
        {sendError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{sendError}</p>
        )}
      </div>

      {/* Recent Verses */}
      {recentVerses.length > 0 && (
        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
          <label className="block text-sm font-medium mb-3">Recent Verses</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {recentVerses.map((ref, idx) => (
              <button
                key={idx}
                onClick={() => handleSendToProjector(ref)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 text-sm font-medium transition-colors"
              >
                <BookOpen size={14} />
                {ref.book} {ref.chapter}:{ref.verse}{ref.endVerse ? `-${ref.endVerse}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
