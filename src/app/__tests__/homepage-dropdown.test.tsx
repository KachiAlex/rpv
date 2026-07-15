/**
 * Feature: homepage-translation-dropdown, Property 1: Dropdown options match store translations
 * Validates: Requirements 1.1
 * 
 * Feature: homepage-translation-dropdown, Property 5: RPV translation appears first  
 * Validates: Requirements 2.3
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useBibleStore } from '@/lib/store';
import HomePage from '../page';
import type { Translation } from '@/lib/types';

// Mock the store
jest.mock('@/lib/store');
const mockUseBibleStore = useBibleStore as jest.MockedFunction<typeof useBibleStore>;

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Helper function to create test translations
function createTranslation(id: string, name?: string, books: any[] = []): Translation {
  return {
    id,
    name: name || id,
    books,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('Homepage Translation Dropdown', () => {
  const mockLoadTranslations = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 1: Dropdown options match store translations', () => {
    test('displays all translations from store', async () => {
      const translations = [
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('kjv', 'King James Version'),
        createTranslation('asv', 'American Standard Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      render(<HomePage />);

      await waitFor(() => {
        // Should display RPV first
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Check that all translations are present in the dropdown
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Verify options match store translations exactly
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(translations.length);
      
      // Check that each translation from store has corresponding option
      translations.forEach(translation => {
        expect(screen.getByRole('option', { name: new RegExp(translation.id, 'i') })).toBeInTheDocument();
      });
    });

    test('shows loading state when translations are loading', async () => {
      mockUseBibleStore.mockReturnValue({
        translations: [],
        isLoading: true,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      render(<HomePage />);

      expect(screen.getByText('Loading translations...')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    test('shows no translations message when store is empty', async () => {
      mockUseBibleStore.mockReturnValue({
        translations: [],
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      render(<HomePage />);

      expect(screen.getByText('No translations available')).toBeInTheDocument();
    });
  });

  describe('Property 5: RPV translation appears first', () => {
    test('RPV appears first regardless of store order', async () => {
      // Test with RPV not first in store
      const translations = [
        createTranslation('asv', 'American Standard Version'),
        createTranslation('kjv', 'King James Version'),
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('custom', 'Custom Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      render(<HomePage />);

      await waitFor(() => {
        // RPV should be selected by default (appears first)
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Verify RPV is the first option in the dropdown
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent(/Redemption Project Version/);
    });

    test('works without RPV in translations', async () => {
      const translations = [
        createTranslation('kjv', 'King James Version'),
        createTranslation('asv', 'American Standard Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      render(<HomePage />);

      await waitFor(() => {
        // Should default to first available translation
        expect(screen.getByDisplayValue('kjv')).toBeInTheDocument();
      });
    });
  });

  describe('Property-based tests with random data', () => {
    test('dropdown always matches store content regardless of translation count', async () => {
      // Test with different numbers of translations
      for (let count = 0; count <= 10; count++) {
        const translations = Array.from({ length: count }, (_, i) => 
          createTranslation(`test${i}`, `Test Version ${i}`)
        );

        mockUseBibleStore.mockReturnValue({
          translations,
          isLoading: false,
          loadTranslations: mockLoadTranslations,
          current: null,
          projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
          channelId: 'default',
          error: null,
          loadSample: jest.fn(),
          setCurrent: jest.fn(),
          setReference: jest.fn(),
          setChannelId: jest.fn(),
          sendToProjector: jest.fn(),
          subscribeToChannel: jest.fn(),
          importJson: jest.fn(),
          mergeTranslation: jest.fn(),
          addOrUpdateVerse: jest.fn(),
          _translationService: {} as any,
          _projectionService: {} as any,
          _unsubscribers: {}
        });

        const { unmount } = render(<HomePage />);

        if (count === 0) {
          expect(screen.getByText('No translations available')).toBeInTheDocument();
        } else {
          const options = screen.getAllByRole('option');
          expect(options).toHaveLength(count);
        }

        unmount();
      }
    });
  });
});

  describe('Property 3: Translation selection persists for search', () => {
    test('selected translation is used in search URL', async () => {
      const translations = [
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('kjv', 'King James Version'),
        createTranslation('asv', 'American Standard Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Change selection to KJV
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'kjv' } });

      // Enter search query
      const searchInput = screen.getByPlaceholderText('Enter passage, keyword, or topic');
      fireEvent.change(searchInput, { target: { value: 'John 3:16' } });

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      // Verify URL contains selected translation
      expect(window.location.href).toContain('translation=kjv');
      expect(window.location.href).toContain('q=John%203%3A16');

      // Restore original location
      window.location = originalLocation;
    });

    test('defaults to RPV when no selection made', async () => {
      const translations = [
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('kjv', 'King James Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Enter search query without changing selection
      const searchInput = screen.getByPlaceholderText('Enter passage, keyword, or topic');
      fireEvent.change(searchInput, { target: { value: 'Genesis 1:1' } });

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      // Should default to RPV
      expect(window.location.href).toContain('translation=RPV');

      // Restore original location
      window.location = originalLocation;
    });

    test('persists selection across multiple searches', async () => {
      const translations = [
        createTranslation('RPV', 'Redemption Project Version'),
        createTranslation('kjv', 'King James Version')
      ];

      mockUseBibleStore.mockReturnValue({
        translations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      });

      // Mock window.location.href
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Select KJV
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'kjv' } });

      // First search
      const searchInput = screen.getByPlaceholderText('Enter passage, keyword, or topic');
      fireEvent.change(searchInput, { target: { value: 'John 3:16' } });
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(window.location.href).toContain('translation=kjv');

      // Reset href for second search
      window.location.href = '';

      // Second search with different query but same selection
      fireEvent.change(searchInput, { target: { value: 'Romans 8:28' } });
      fireEvent.click(searchButton);

      // Should still use KJV
      expect(window.location.href).toContain('translation=kjv');
      expect(window.location.href).toContain('Romans%208%3A28');

      // Restore original location
      window.location = originalLocation;
    });
  });

  describe('Property 4: Dropdown updates with store changes', () => {
    test('dropdown updates when store translations change', async () => {
      const initialTranslations = [
        createTranslation('RPV', 'Redemption Project Version')
      ];

      const mockStore = {
        translations: initialTranslations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      };

      mockUseBibleStore.mockReturnValue(mockStore);

      const { rerender } = render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });

      // Initially should have 1 option
      expect(screen.getAllByRole('option')).toHaveLength(1);

      // Update store with more translations
      const updatedTranslations = [
        ...initialTranslations,
        createTranslation('kjv', 'King James Version'),
        createTranslation('asv', 'American Standard Version')
      ];

      mockUseBibleStore.mockReturnValue({
        ...mockStore,
        translations: updatedTranslations
      });

      rerender(<HomePage />);

      await waitFor(() => {
        // Should now have 3 options
        expect(screen.getAllByRole('option')).toHaveLength(3);
        expect(screen.getByRole('option', { name: /King James Version/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /American Standard Version/i })).toBeInTheDocument();
      });
    });

    test('dropdown handles loading state changes', async () => {
      const translations = [
        createTranslation('RPV', 'Redemption Project Version')
      ];

      const mockStore = {
        translations: [],
        isLoading: true,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      };

      mockUseBibleStore.mockReturnValue(mockStore);

      const { rerender } = render(<HomePage />);

      // Initially loading
      expect(screen.getByText('Loading translations...')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeDisabled();

      // Update to loaded state
      mockUseBibleStore.mockReturnValue({
        ...mockStore,
        translations,
        isLoading: false
      });

      rerender(<HomePage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading translations...')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox')).not.toBeDisabled();
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });
    });

    test('dropdown reactively updates default selection when RPV becomes available', async () => {
      const nonRpvTranslations = [
        createTranslation('kjv', 'King James Version'),
        createTranslation('asv', 'American Standard Version')
      ];

      const mockStore = {
        translations: nonRpvTranslations,
        isLoading: false,
        loadTranslations: mockLoadTranslations,
        current: null,
        projectorRef: { translation: '', book: '', chapter: 0, verse: 0, text: '' },
        channelId: 'default',
        error: null,
        loadSample: jest.fn(),
        setCurrent: jest.fn(),
        setReference: jest.fn(),
        setChannelId: jest.fn(),
        sendToProjector: jest.fn(),
        subscribeToChannel: jest.fn(),
        importJson: jest.fn(),
        mergeTranslation: jest.fn(),
        addOrUpdateVerse: jest.fn(),
        _translationService: {} as any,
        _projectionService: {} as any,
        _unsubscribers: {}
      };

      mockUseBibleStore.mockReturnValue(mockStore);

      const { rerender } = render(<HomePage />);

      await waitFor(() => {
        // Should default to first available (kjv)
        expect(screen.getByDisplayValue('kjv')).toBeInTheDocument();
      });

      // Add RPV to translations
      const withRpvTranslations = [
        createTranslation('RPV', 'Redemption Project Version'),
        ...nonRpvTranslations
      ];

      mockUseBibleStore.mockReturnValue({
        ...mockStore,
        translations: withRpvTranslations
      });

      rerender(<HomePage />);

      await waitFor(() => {
        // Should now default to RPV
        expect(screen.getByDisplayValue('RPV')).toBeInTheDocument();
      });
    });
  });
});