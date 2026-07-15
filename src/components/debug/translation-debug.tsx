"use client";
import { useBibleStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export function TranslationDebug() {
  const { translations, current, loadTranslations } = useBibleStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Auto-load translations on mount
    loadTranslations();
  }, [loadTranslations]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        Debug Translations
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Translation Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Current:</strong> {current?.name || 'None'} ({current?.id || 'N/A'})
        </div>
        
        <div>
          <strong>Total Translations:</strong> {translations.length}
        </div>
        
        <div>
          <strong>Available Translations:</strong>
          <ul className="ml-2 mt-1 space-y-1">
            {translations.map((t, index) => (
              <li key={t.id || index} className="text-xs">
                • {t.name} ({t.id}) - {t.books?.length || 0} books
                {t.books && t.books.length > 0 && (
                  <div className="ml-2 text-gray-600">
                    Books: {t.books.map(b => b.name).join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={() => loadTranslations()}
          className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs"
        >
          Reload Translations
        </button>
      </div>
    </div>
  );
}