import type { Translation } from '../types';

/**
 * Format translation name for display in dropdown
 * Maps translation IDs to user-friendly display names
 */
export function formatTranslationName(translation: Translation): string {
  const nameMap: Record<string, string> = {
    'RPV': 'Redemption Project Version (RPV)',
    'kjv': 'King James Version (KJV)',
    'asv': 'American Standard Version (ASV)',
    'KJV': 'King James Version (KJV)',
    'ASV': 'American Standard Version (ASV)',
  };
  
  // Use predefined mapping if available
  if (nameMap[translation.id]) {
    return nameMap[translation.id];
  }
  
  // Fallback to translation name with ID
  if (translation.name && translation.name !== translation.id) {
    return `${translation.name} (${translation.id.toUpperCase()})`;
  }
  
  // Final fallback to just ID
  return translation.id.toUpperCase();
}

/**
 * Sort translations with RPV first, then alphabetically
 */
export function sortTranslations(translations: Translation[]): Translation[] {
  return [...translations].sort((a, b) => {
    // RPV always comes first
    if (a.id === 'RPV') return -1;
    if (b.id === 'RPV') return 1;
    
    // Sort others alphabetically by display name
    const nameA = formatTranslationName(a);
    const nameB = formatTranslationName(b);
    return nameA.localeCompare(nameB);
  });
}

/**
 * Get default translation ID (RPV if available, otherwise first translation)
 */
export function getDefaultTranslationId(translations: Translation[]): string {
  if (translations.length === 0) return '';
  
  const rpv = translations.find(t => t.id === 'RPV');
  if (rpv) return 'RPV';
  
  return translations[0].id;
}