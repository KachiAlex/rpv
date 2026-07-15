import { onRequest } from 'firebase-functions/v2/https';
import express = require('express');
import cors = require('cors');

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'https://redemptionprojectversion.web.app',
    'https://redemptionprojectversion.firebaseapp.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Simple mock data for testing
const mockVerses = [
  {
    book: "Philippians",
    chapter: 4,
    verse: 6,
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    topics: ["anxiety", "prayer", "peace"]
  },
  {
    book: "Philippians",
    chapter: 4,
    verse: 7,
    text: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    topics: ["peace", "comfort", "protection"]
  },
  {
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    topics: ["love", "salvation", "eternal life"]
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'RPV Bible AI Assistant is running (Firebase Functions)',
    embeddings_loaded: true,
    conversation_ready: true,
    backend_type: 'firebase-functions',
    ml_available: false,
    timestamp: new Date().toISOString(),
    stats: {
      total_verses: mockVerses.length,
      backend_type: 'firebase-functions'
    }
  });
});

// Main search endpoint
app.get('/search', (req, res) => {
  const startTime = Date.now();
  
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;
    
    if (!query || query.trim().length < 2) {
      res.status(400).json({
        error: 'Query must be at least 2 characters long'
      });
      return;
    }
    
    // Simple search through mock verses
    const queryLower = query.toLowerCase();
    const results = mockVerses.filter(verse => 
      verse.text.toLowerCase().includes(queryLower) ||
      verse.topics.some(topic => topic.includes(queryLower))
    ).map(verse => ({
      ...verse,
      relevance_score: 0.8,
      match_reasons: ['Mock search result']
    }));
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      query: query.trim(),
      results,
      total_results: results.length,
      processing_time_ms: processingTime,
      session_id: sessionId,
      backend_type: 'firebase-functions',
      note: results.length > 0 ? undefined : 'No verses found for this query. Try different keywords.'
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'An error occurred while searching. Please try again.'
    });
  }
});

// Feedback endpoint
app.post('/feedback', (req, res) => {
  try {
    const { session_id, query, feedback, selected_verses } = req.body;
    
    console.log('Feedback received:', { 
      session_id, 
      query, 
      feedback, 
      selected_verses,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Thank you for your feedback!',
      feedback_id: `fb_${Date.now()}`
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      error: 'Failed to process feedback'
    });
  }
});

// Export the Express app as a Firebase Function v2
export const bibleApi = onRequest({
  cors: true,
  region: 'us-central1',
  timeoutSeconds: 60,
  memory: '256MiB'
}, app);