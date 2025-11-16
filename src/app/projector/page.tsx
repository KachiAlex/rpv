"use client";
import { useEffect, useState, useMemo } from 'react';
import { useBibleStore } from '@/lib/store';
import { Settings, ZoomIn, ZoomOut, BookOpen, Mic, MicOff, Send, X } from 'lucide-react';
import { VoiceRecognition, parseBibleReference } from '@/lib/utils/voice-recognition';
import type { Reference } from '@/lib/types';

export default function ProjectorPage() {
  const { translations, current, projectorRef, subscribeToChannel, setChannelId, sendToProjector, loadTranslations, loadSample, setCurrent } = useBibleStore();
  const [channel, setChannel] = useState('default');
  const [fontSize, setFontSize] = useState(48);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verse, setVerse] = useState(16);
  const [voiceRecognition] = useState(() => new VoiceRecognition());
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  useEffect(() => {
    loadTranslations().catch(async () => {
      await loadSample();
    });
    setChannelId(channel);
    subscribeToChannel().catch(console.error);
  }, [channel, setChannelId, subscribeToChannel, loadTranslations, loadSample]);

  // Load saved font size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rpv:projector:fontSize');
      if (saved) {
        setFontSize(Number(saved) || 48);
      }
    }
  }, []);

  const saveFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem('rpv:projector:fontSize', String(size));
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 8, 120);
    saveFontSize(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 8, 24);
    saveFontSize(newSize);
  };

  const books = useMemo(() => (current?.books ?? []).filter(b => b && b.name && Array.isArray(b.chapters)), [current]);
  const chapters = useMemo(() => {
    const b = books.find(b => b.name === book);
    return (b && Array.isArray(b.chapters)) ? b.chapters.map((c) => c?.number).filter(n => typeof n === 'number') : [];
  }, [books, book]);
  const verses = useMemo(() => {
    const b = books.find(b => b.name === book);
    const c = b?.chapters?.find((c) => c?.number === chapter);
    return (c && Array.isArray(c.verses)) ? c.verses.map((v) => v?.number).filter(n => typeof n === 'number') : [];
  }, [books, book, chapter]);

  const handleProjectVerse = async () => {
    try {
      await sendToProjector({ book, chapter, verse });
      setShowVerseSelector(false);
    } catch (error) {
      alert(`Error projecting verse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleVoiceResult = (text: string) => {
    console.log('[Projector] Voice result received:', text);
    setVoiceText(`Heard: "${text}"`);
    const parsed = parseBibleReference(text);
    console.log('[Projector] Parsed result:', parsed);
    
    if (parsed.book && parsed.chapter && parsed.verse) {
      setBook(parsed.book);
      setChapter(parsed.chapter);
      setVerse(parsed.verse);
      setVoiceText(`✓ ${parsed.book} ${parsed.chapter}:${parsed.verse} (confidence: ${Math.round(parsed.confidence * 100)}%)`);
      
      // Auto-project if confidence is reasonable (lowered threshold)
      if (parsed.confidence >= 0.6) {
        setTimeout(() => {
          handleProjectVerse();
        }, 200);
      } else {
        // Still update the form even if confidence is lower
        console.log(`Parsed with confidence ${parsed.confidence}, updating form but not auto-projecting`);
        setVoiceText(`Found: ${parsed.book} ${parsed.chapter}:${parsed.verse} (low confidence - click Project to confirm)`);
      }
    } else {
      // Show what was heard and suggest formats
      console.warn(`Could not parse reference from: "${text}"`);
      setVoiceText(`Could not parse: "${text}". Try: "John 3:16" or "John 3 16" or "John chapter 3 verse 16"`);
      setTimeout(() => setVoiceText(''), 5000);
    }
  };

  const toggleVoiceRecognition = async () => {
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
            console.error('[Projector] Voice recognition error:', error);
            setVoiceText(`Error: ${error.message}`);
            setIsListening(false);
            // Show error for a few seconds
            setTimeout(() => setVoiceText(''), 5000);
          }
        );
        setVoiceText('🎤 Listening... Speak now');
      } catch (error) {
        console.error('[Projector] Failed to start voice recognition:', error);
        setIsListening(false);
        setVoiceText(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setVoiceText(''), 5000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 flex flex-col relative">
      {/* Verse Selector Panel */}
      {showVerseSelector && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent">
                Select Verse to Project
              </h2>
              <button
                onClick={() => setShowVerseSelector(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Translation Selection */}
            <div>
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
            {voiceRecognition.isAvailable() && (
              <div className="rounded-lg border-2 border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:from-accent-purple/90 hover:to-accent-pink/90'
                    } shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
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
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                  Try saying: "John 3:16" or "John chapter 3 verse 16"
                </p>
              </div>
            )}

            {/* Verse Selection */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
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

              <div>
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
                    <option key={c} value={c}>Chapter {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Verse</label>
                <select 
                  className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-accent-purple focus:border-accent-purple" 
                  value={verse} 
                  onChange={(e) => setVerse(Number(e.target.value))}
                >
                  {verses.map((v) => (
                    <option key={v} value={v}>Verse {v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-800 dark:to-neutral-800 p-4">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {book} {chapter}:{verse}
              </p>
              <p className="text-xs text-neutral-500 line-clamp-3">
                {verses.length > 0 && current?.books.find(b => b.name === book)?.chapters.find(c => c.number === chapter)?.verses.find(v => v.number === verse)?.text || 'Select a verse'}
              </p>
            </div>

            {/* Project Button */}
            <button 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-accent-purple text-white font-medium hover:from-brand-700 hover:to-accent-purple/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              onClick={handleProjectVerse}
            >
              <Send size={20} />
              Project Verse
            </button>
          </div>
        </div>
      )}

      {/* Settings Bar */}
      <div className={`absolute top-0 right-0 z-10 transition-all duration-300 ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-white dark:bg-neutral-800 rounded-l-lg shadow-2xl p-4 m-4 border-2 border-brand-200 dark:border-brand-800">
          <div className="space-y-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Channel</label>
              <input 
                className="w-full rounded-lg border-2 border-brand-300 dark:border-brand-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:ring-2 focus:ring-accent-purple focus:border-accent-purple" 
                value={channel} 
                onChange={(e) => setChannel(e.target.value)}
                placeholder="default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Font Size: {fontSize}px</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseFontSize}
                  className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
                  title="Decrease font size"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="24"
                  max="120"
                  value={fontSize}
                  onChange={(e) => saveFontSize(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={increaseFontSize}
                  className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
                  title="Increase font size"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setShowVerseSelector(!showVerseSelector)}
          className="p-3 rounded-lg bg-white/10 dark:bg-neutral-800/50 backdrop-blur hover:bg-white/20 dark:hover:bg-neutral-700/50 transition-colors text-white"
          title="Select Verse"
        >
          <BookOpen size={24} />
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-lg bg-white/10 dark:bg-neutral-800/50 backdrop-blur hover:bg-white/20 dark:hover:bg-neutral-700/50 transition-colors text-white"
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Projection Area */}
      <div className="flex-1 grid place-items-center p-8">
        <div className="w-full max-w-6xl">
          {/* Reference Header - Fixed height to prevent twitching */}
          <div 
            className="text-center mb-6 font-medium opacity-90"
            style={{ 
              fontSize: `${fontSize * 0.3}px`, 
              height: `${fontSize * 0.5}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {projectorRef.book ? (
              <span className="bg-gradient-to-r from-accent-teal via-accent-blue to-accent-purple bg-clip-text text-transparent">
                {projectorRef.translation || 'Bible'} • {projectorRef.book} {projectorRef.chapter}:{projectorRef.verse}
              </span>
            ) : (
              <span className="opacity-0">Bible</span>
            )}
          </div>

          {/* Verse Text - Fixed container to prevent layout shifts */}
          <div 
            className="text-center leading-relaxed text-white font-light min-h-[200px] flex items-center justify-center"
            style={{ fontSize: `${fontSize}px` }}
          >
            {projectorRef.text || (
              <div className="space-y-4">
                <div className="animate-pulse opacity-50">
                  Waiting for verse...
                </div>
                <p className="text-lg opacity-70 mt-8">
                  Click the book icon to select a verse to project
                </p>
              </div>
            )}
          </div>

          {/* Channel Indicator */}
          <div className="mt-8 text-center text-sm opacity-60 text-white">
            Channel: <span className="font-mono font-semibold">{channel}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen instructions */}
      {!showSettings && !showVerseSelector && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-white/40 text-center">
          Press F11 for fullscreen • Click the book icon to select verses
        </div>
      )}
    </div>
  );
}
