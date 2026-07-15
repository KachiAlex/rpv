"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bibleApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
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
// Lazy load the search engine to avoid initialization timeout
let searchEngine = null;
async function getSearchEngine() {
    if (!searchEngine) {
        const { EnhancedBibleSearch } = await Promise.resolve().then(() => __importStar(require('./enhanced-search')));
        searchEngine = new EnhancedBibleSearch();
    }
    return searchEngine;
}
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const engine = await getSearchEngine();
        const stats = engine.getStats();
        const response = {
            status: 'healthy',
            message: 'RPV Bible AI Assistant is running (Enhanced Firebase Functions)',
            embeddings_loaded: true,
            conversation_ready: true,
            backend_type: 'firebase-functions-enhanced',
            ml_available: false,
            timestamp: new Date().toISOString(),
            stats
        };
        res.json(response);
    }
    catch (error) {
        res.json({
            status: 'initializing',
            message: 'RPV Bible AI Assistant is starting up',
            embeddings_loaded: false,
            conversation_ready: false,
            backend_type: 'firebase-functions-enhanced',
            ml_available: false,
            timestamp: new Date().toISOString()
        });
    }
});
// Main search endpoint
app.get('/search', async (req, res) => {
    const startTime = Date.now();
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;
        const sessionId = req.headers['x-session-id'] || `session_${Date.now()}`;
        if (!query || query.trim().length < 2) {
            res.status(400).json({
                error: 'Query must be at least 2 characters long'
            });
            return;
        }
        // Get search engine and perform search
        const engine = await getSearchEngine();
        const results = engine.search(query.trim(), Math.min(limit, 50));
        const suggestions = engine.getSuggestions(query.trim());
        const processingTime = Date.now() - startTime;
        const response = {
            query: query.trim(),
            results,
            total_results: results.length,
            processing_time_ms: processingTime,
            session_id: sessionId,
            backend_type: 'firebase-functions-enhanced',
            suggestions: suggestions.length > 0 ? suggestions.slice(0, 3) : undefined,
            note: results.length > 0 ? undefined : 'No verses found for this query. Try different keywords or check suggestions.'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'An error occurred while searching. Please try again.'
        });
    }
});
// Suggestions endpoint
app.get('/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';
        const engine = await getSearchEngine();
        const suggestions = engine.getSuggestions(query);
        res.json({
            query,
            suggestions,
            popular_searches: [
                'How to find peace in difficult times',
                'What does the Bible say about love',
                'Overcoming fear and anxiety',
                'Finding strength in weakness',
                'God\'s forgiveness and mercy',
                'Hope in times of trouble'
            ]
        });
    }
    catch (error) {
        res.json({
            query: req.query.q || '',
            suggestions: [],
            popular_searches: [
                'How to find peace in difficult times',
                'What does the Bible say about love',
                'Overcoming fear and anxiety'
            ]
        });
    }
});
// Feedback endpoint
app.post('/feedback', (req, res) => {
    try {
        const { session_id, query, feedback, selected_verses } = req.body;
        // Log detailed feedback for analysis
        console.log('Enhanced feedback received:', {
            session_id,
            query,
            feedback,
            selected_verses,
            timestamp: new Date().toISOString()
        });
        res.json({
            message: 'Thank you for your feedback! This helps improve our search.',
            feedback_id: `fb_${Date.now()}`
        });
    }
    catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({
            error: 'Failed to process feedback'
        });
    }
});
// Analytics endpoint
app.get('/analytics', async (req, res) => {
    try {
        const engine = await getSearchEngine();
        const stats = engine.getStats();
        res.json({
            search_engine: stats,
            performance: {
                avg_response_time: '< 10ms',
                uptime: '99.9%',
                total_searches_today: Math.floor(Math.random() * 1000) + 500 // Mock data
            },
            popular_topics: stats.most_common_topics,
            system_info: {
                backend_type: 'firebase-functions-enhanced',
                version: '2.1.0',
                last_updated: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.json({
            error: 'Analytics temporarily unavailable'
        });
    }
});
// Stats endpoint (backward compatibility)
app.get('/stats', async (req, res) => {
    try {
        const engine = await getSearchEngine();
        const stats = engine.getStats();
        res.json(Object.assign(Object.assign({ status: 'ready', total_verses: stats.total_verses, backend_type: 'firebase-functions-enhanced', ml_available: false, enhanced_features: true }, stats), { note: 'Running Enhanced Firebase Functions with comprehensive Bible data' }));
    }
    catch (error) {
        res.json({
            status: 'initializing',
            backend_type: 'firebase-functions-enhanced',
            ml_available: false,
            enhanced_features: true
        });
    }
});
// Topic exploration endpoint
app.get('/topics', async (req, res) => {
    try {
        const engine = await getSearchEngine();
        const stats = engine.getStats();
        res.json({
            available_topics: stats.most_common_topics,
            topic_categories: {
                'Emotional Support': ['anxiety', 'fear', 'comfort', 'peace', 'hope'],
                'Spiritual Growth': ['faith', 'prayer', 'wisdom', 'love', 'forgiveness'],
                'Life Guidance': ['strength', 'guidance', 'purpose', 'provision', 'protection'],
                'Relationships': ['love', 'forgiveness', 'kindness', 'marriage', 'family']
            },
            total_topics: stats.total_topics
        });
    }
    catch (error) {
        res.json({
            available_topics: [],
            topic_categories: {
                'Emotional Support': ['anxiety', 'fear', 'comfort', 'peace', 'hope'],
                'Spiritual Growth': ['faith', 'prayer', 'wisdom', 'love', 'forgiveness'],
                'Life Guidance': ['strength', 'guidance', 'purpose', 'provision', 'protection'],
                'Relationships': ['love', 'forgiveness', 'kindness', 'marriage', 'family']
            },
            total_topics: 0
        });
    }
});
// Export the Express app as a Firebase Function v2
exports.bibleApi = (0, https_1.onRequest)({
    cors: true,
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB'
}, app);
//# sourceMappingURL=index.js.map