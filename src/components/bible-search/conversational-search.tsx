'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, HelpCircle, Send } from 'lucide-react';

// Enhanced types for conversational AI
interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance_score?: number;
  contextualRelevance?: string;
  applicationSuggestion?: string;
  relatedThemes?: string[];
  emotionalResonance?: number;
}

interface ClarificationOption {
  id: string;
  text: string;
  topic?: string;
  subtopic?: string;
}

interface ClarificationRequest {
  question: string;
  options: ClarificationOption[];
  type: string;
  emotionalContext?: string;
}

interface ConversationState {
  sessionId: string;
  phase: string;
  topicsDiscussed: string[];
  emotionalJourney: string[];
  userPreferences: any;
  lastActivity: Date;
}

interface ConversationResponse {
  text: string;
  verses?: BibleVerse[];
  followUpQuestions?: string[];
  clarificationNeeded?: ClarificationRequest;
  conversationState: ConversationState;
  suggestions?: string[];
  relatedTopics?: string[];
  confidence: number;
  processingTimeMs: number;
}

interface ConversationHistory {
  id: string;
  timestamp: Date;
  userInput: string;
  aiResponse: string;
  verses: BibleVerse[];
  topicsDiscussed: string[];
  emotionalContext?: string;
}

export function ConversationalBibleSearch() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ConversationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [originalQuery, setOriginalQuery] = useState('');
  const [backendNote, setBackendNote] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [clarification, setClarification] = useState<ClarificationRequest | null>(null);
  const [results, setResults] = useState<BibleVerse[]>([]);

  // Generate session ID on component mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Load conversation history when session changes
  useEffect(() => {
    if (sessionId) {
      loadConversationHistory();
    }
  }, [sessionId]);

  const loadConversationHistory = async () => {
    try {
      const historyResponse = await fetch(`/api/bible-search/conversation/history?sessionId=${sessionId}`);
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        setConversationHistory(history);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setOriginalQuery(searchQuery);
    
    try {
      const requestBody = {
        text: searchQuery.trim(),
        sessionId,
        timestamp: new Date().toISOString(),
        metadata: {
          followUp: conversationHistory.length > 0
        }
      };

      const apiResponse = await fetch('/api/bible-search/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const conversationResponse: ConversationResponse = await apiResponse.json();
      
      setResponse(conversationResponse);
      
      // Update session ID if provided
      if (conversationResponse.conversationState.sessionId !== sessionId) {
        setSessionId(conversationResponse.conversationState.sessionId);
      }
      
      // Reload conversation history to include the new interaction
      await loadConversationHistory();
      
    } catch (error) {
      console.error('Conversation error:', error);
      
      // Fallback response
      setResponse({
        text: "I apologize, but I'm having trouble processing your request right now. Could you try rephrasing your question?",
        conversationState: {
          sessionId,
          phase: 'introduction',
          topicsDiscussed: [],
          emotionalJourney: [],
          userPreferences: {},
          lastActivity: new Date()
        },
        confidence: 0.1,
        processingTimeMs: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClarification = async (optionId: string, additionalContext?: string) => {
    setLoading(true);
    
    try {
      const requestBody = {
        sessionId,
        originalQuery,
        selectedOptionId: optionId,
        additionalContext
      };

      const apiResponse = await fetch('/api/bible-search/conversation/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Clarification API error: ${apiResponse.status}`);
      }

      const conversationResponse: ConversationResponse = await apiResponse.json();
      setResponse(conversationResponse);
      
      // Reload conversation history
      await loadConversationHistory();
      
    } catch (error) {
      console.error('Clarification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedback: 'helpful' | 'not_helpful' | 'partially_helpful') => {
    try {
      await fetch('/api/bible-search/conversation/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          query: originalQuery,
          feedback
        })
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleFollowUpClick = (question: string) => {
    setQuery(question);
    handleSearch(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="rpv-page-padding" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="rpv-hero" style={{ marginBottom: 20 }}>
        <div className="rpv-pill-row">
          <span className="rpv-pill rpv-pill-navy">
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            AI Powered
          </span>
        </div>
        <h1 className="rpv-serif">Ask the Bible Anything</h1>
        <p>AI-powered search with conversational understanding. Ask natural questions and get relevant verses with context.</p>
      </div>

      {/* Search Section */}
      <div className="rpv-card" style={{ marginBottom: 20 }}>
        <div className="rpv-field-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about any topic... (e.g., 'How to find peace in difficult times?')"
            onKeyDown={handleKeyPress}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="rpv-btn-red"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} />
              {loading ? 'Searching...' : 'Search'}
            </span>
          </button>
        </div>

        {/* Backend Status */}
        {backendNote && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--rpv-lav)', borderRadius: 8, border: '1px solid var(--rpv-border)' }}>
            <p style={{ fontSize: 13, color: 'var(--rpv-ink-soft)' }}>
              ℹ️ {backendNote}
            </p>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--rpv-ink-soft)', marginBottom: 8 }}>💡 Based on your previous searches:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="rpv-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clarification Section */}
      {clarification && (
        <div className="rpv-card" style={{ marginBottom: 20, background: 'var(--navy-50)', borderColor: 'var(--navy-200)' }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={18} />
              {clarification.question}
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {clarification.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleClarification(option.id, option.text)}
                className="rpv-btn-outline-navy"
                style={{ textAlign: 'left' }}
              >
                {option.text}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--navy-600)', marginTop: 10 }}>
            This helps me find more relevant verses for you!
          </p>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {/* Results Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--rpv-ink)' }}>
              📖 Found {results.length} relevant verses
            </h3>

            {/* Feedback Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleFeedback('helpful')}
                className="rpv-chip"
                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
              >
                <ThumbsUp size={13} style={{ display: 'inline', marginRight: 4 }} />
                Helpful
              </button>
              <button
                onClick={() => handleFeedback('partially_helpful')}
                className="rpv-chip"
                style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
              >
                <HelpCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                Partially
              </button>
              <button
                onClick={() => handleFeedback('not_helpful')}
                className="rpv-chip"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
              >
                <ThumbsDown size={13} style={{ display: 'inline', marginRight: 4 }} />
                Not helpful
              </button>
            </div>
          </div>

          {/* Verse Cards */}
          <div className="rpv-results">
            {results.map((verse, index) => (
              <div key={index} className="rpv-result-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div className="rpv-result-ref">
                    {verse.book} {verse.chapter}:{verse.verse}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {verse.relevance_score && (
                      <div className="rpv-result-meta" style={{ background: 'var(--rpv-lav)', padding: '2px 8px', borderRadius: 4 }}>
                        {(verse.relevance_score * 100).toFixed(0)}% match
                      </div>
                    )}
                    {(verse as any).match_reasons && (
                      <div className="rpv-result-meta" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(verse as any).match_reasons.join(', ')}>
                        {(verse as any).match_reasons[0]}
                      </div>
                    )}
                  </div>
                </div>
                <div className="rpv-result-text">
                  "{verse.text}"
                </div>
                {(verse as any).topics && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {(verse as any).topics.slice(0, 4).map((topic: string, topicIndex: number) => (
                      <span key={topicIndex} className="rpv-chip" style={{ fontSize: 11 }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && !clarification && (
        <div className="rpv-card" style={{ textAlign: 'center', padding: 32, marginBottom: 20 }}>
          <div style={{ color: 'var(--rpv-ink-faint)' }}>
            <p>No verses found for "{query}"</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try rephrasing your question or use different keywords.</p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="rpv-card" style={{ background: 'var(--rpv-lav)' }}>
        <h4 style={{ fontWeight: 600, color: 'var(--rpv-ink)', marginBottom: 10 }}>💬 How to get better results:</h4>
        <ul style={{ fontSize: 13, color: 'var(--rpv-ink-soft)', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>• Ask natural questions: "How can I find peace?"</li>
          <li>• Describe your situation: "I'm struggling with anxiety"</li>
          <li>• Use topic words: "forgiveness", "love", "hope"</li>
          <li>• The AI learns from your searches to give better suggestions</li>
        </ul>
      </div>
    </div>
  );
}