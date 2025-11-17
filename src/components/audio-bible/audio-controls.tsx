"use client";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioBibleService, type AudioBibleOptions } from '@/lib/services/audio-bible-service';
import type { Verse } from '@/lib/types';

interface AudioControlsProps {
  verses: Array<{ number: number; text: string }>;
  currentVerse: number;
  onVerseChange: (verse: number) => void;
  translationName?: string;
}

export function AudioControls({
  verses,
  currentVerse,
  onVerseChange,
  translationName,
}: AudioControlsProps) {
  const [audioService] = useState(() => new AudioBibleService());
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [options, setOptions] = useState<AudioBibleOptions>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      setIsAvailable(audioService.isAvailable());
      if (audioService.isAvailable()) {
        const loadedVoices = await audioService.loadVoices();
        setVoices(loadedVoices);
        
        // Try to find a default English voice
        const englishVoice = loadedVoices.find(
          v => v.lang.startsWith('en') && v.localService
        ) || loadedVoices.find(v => v.lang.startsWith('en')) || loadedVoices[0];
        
        if (englishVoice) {
          setSelectedVoice(englishVoice);
          audioService.setOptions({ voice: englishVoice });
        }
      }
    };

    checkAvailability();

    // Set up verse change callback
    audioService.setOnVerseChange((verseNum) => {
      onVerseChange(verseNum);
    });

    // Check playing state periodically
    const interval = setInterval(() => {
      const state = audioService.getPlayingState();
      setIsPlaying(state === 'playing');
      setIsPaused(state === 'paused');
    }, 100);

    return () => {
      clearInterval(interval);
      audioService.stop();
    };
  }, []);

  useEffect(() => {
    if (selectedVoice) {
      audioService.setOptions({ ...options, voice: selectedVoice });
    } else {
      audioService.setOptions(options);
    }
  }, [options, selectedVoice]);

  const handlePlay = async () => {
    if (isPaused) {
      audioService.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      try {
        // Start from current verse
        await audioService.play(verses, currentVerse);
        setIsPlaying(true);
        setIsPaused(false);
      } catch (error) {
        console.error('Error playing audio:', error);
        alert('Failed to play audio. Please try again.');
      }
    }
  };

  const handlePause = () => {
    audioService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!isAvailable) {
    return (
      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 text-center">
        Audio Bible is not available in this browser. Please use a modern browser with text-to-speech support.
      </div>
    );
  }

  return (
    <div className="border-2 border-brand-200 dark:border-brand-800 rounded-xl bg-white dark:bg-neutral-800 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 size={20} className="text-brand-600 dark:text-brand-400" />
          <div>
            <div className="font-semibold text-brand-700 dark:text-brand-300">
              Audio Bible
            </div>
            {translationName && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {translationName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title="Audio Settings"
          >
            <Settings size={18} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        {!isPlaying && !isPaused ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Play size={18} fill="white" />
            Play from Verse {currentVerse}
          </button>
        ) : isPlaying ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Pause size={18} fill="white" />
            Pause
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            <Play size={18} fill="white" />
            Resume
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
          >
            <Square size={16} fill="white" />
            Stop
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Voice
            </label>
            <select
              value={selectedVoice ? voices.indexOf(selectedVoice) : ''}
              onChange={(e) => {
                const voice = voices[Number(e.target.value)];
                setSelectedVoice(voice);
                audioService.setOptions({ voice });
              }}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 p-2 text-sm"
            >
              {voices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} ({voice.lang}) {voice.localService ? '(Local)' : '(Remote)'}
                </option>
              ))}
            </select>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Speed: {options.rate?.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={options.rate || 1.0}
              onChange={(e) => {
                const rate = Number(e.target.value);
                setOptions({ ...options, rate });
                audioService.setOptions({ rate });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Pitch Control */}
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Pitch: {options.pitch?.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={options.pitch || 1.0}
              onChange={(e) => {
                const pitch = Number(e.target.value);
                setOptions({ ...options, pitch });
                audioService.setOptions({ pitch });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
              Volume: {Math.round((options.volume || 1.0) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={options.volume || 1.0}
              onChange={(e) => {
                const volume = Number(e.target.value);
                setOptions({ ...options, volume });
                audioService.setOptions({ volume });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {(isPlaying || isPaused) && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {isPlaying ? 'Playing...' : 'Paused'}
          </div>
        </div>
      )}
    </div>
  );
}

