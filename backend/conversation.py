"""
Conversational AI for Bible Search
Handles learning from user interactions and asking clarifying questions
"""

import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import sqlite3
from pathlib import Path
import re

logger = logging.getLogger(__name__)

class ConversationManager:
    def __init__(self, db_path: str = "conversations.db"):
        """
        Initialize conversation manager with learning capabilities
        
        Args:
            db_path: Path to SQLite database for storing conversations
        """
        self.db_path = db_path
        self.setup_database()
        
        # Common Bible topics for clarification
        self.bible_topics = {
            "love": ["God's love", "loving others", "romantic love", "self-love"],
            "fear": ["fear of God", "overcoming fear", "anxiety", "worry"],
            "faith": ["having faith", "faith in trials", "growing faith", "doubt"],
            "prayer": ["how to pray", "answered prayer", "prayer requests", "worship"],
            "forgiveness": ["God's forgiveness", "forgiving others", "repentance", "mercy"],
            "peace": ["inner peace", "peace with others", "God's peace", "conflict resolution"],
            "strength": ["God's strength", "personal strength", "weakness", "perseverance"],
            "wisdom": ["godly wisdom", "making decisions", "understanding", "knowledge"],
            "salvation": ["being saved", "eternal life", "redemption", "grace"],
            "hope": ["hope in God", "future hope", "despair", "encouragement"]
        }
        
        # Question patterns for clarification
        self.clarification_patterns = [
            "Are you looking for verses about {topic} in general, or something more specific?",
            "Would you like to know about {topic} from a personal perspective or theological perspective?",
            "Are you interested in {topic} in the context of {context1} or {context2}?",
            "Do you want verses that talk about {topic} directly, or stories that demonstrate it?",
            "Are you looking for comfort, guidance, or understanding about {topic}?"
        ]
    
    def setup_database(self):
        """Setup SQLite database for conversation tracking"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables for conversation tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                timestamp DATETIME,
                user_query TEXT,
                refined_query TEXT,
                results_count INTEGER,
                user_feedback TEXT,
                clarification_asked BOOLEAN DEFAULT FALSE,
                clarification_response TEXT
            )
        ''')
        
        # Create table for learning patterns
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS query_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_query TEXT,
                successful_refinement TEXT,
                topic_category TEXT,
                usage_count INTEGER DEFAULT 1,
                last_used DATETIME
            )
        ''')
        
        # Create table for user preferences
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                session_id TEXT PRIMARY KEY,
                preferred_topics TEXT,
                search_style TEXT,
                clarification_frequency TEXT,
                last_interaction DATETIME
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """
        Analyze user query to understand intent and identify potential ambiguities
        
        Args:
            query: User's search query
            
        Returns:
            Dictionary with intent analysis
        """
        query_lower = query.lower()
        
        # Detect question types
        question_words = ["what", "how", "why", "when", "where", "who"]
        is_question = any(word in query_lower for word in question_words)
        
        # Detect emotional context
        emotional_words = {
            "comfort": ["comfort", "sad", "grief", "loss", "hurt", "pain"],
            "guidance": ["help", "decision", "choose", "guidance", "direction"],
            "encouragement": ["encourage", "hope", "strength", "motivation"],
            "understanding": ["understand", "meaning", "explain", "why"]
        }
        
        emotional_context = []
        for emotion, words in emotional_words.items():
            if any(word in query_lower for word in words):
                emotional_context.append(emotion)
        
        # Detect Bible topics
        detected_topics = []
        for topic, variations in self.bible_topics.items():
            if topic in query_lower or any(var in query_lower for var in variations):
                detected_topics.append(topic)
        
        # Detect ambiguity indicators
        ambiguous_phrases = [
            "about", "regarding", "concerning", "related to",
            "anything", "something", "everything"
        ]
        is_ambiguous = any(phrase in query_lower for phrase in ambiguous_phrases)
        
        # Check if query is too broad or too narrow
        word_count = len(query.split())
        is_too_broad = word_count <= 3 and is_ambiguous
        is_too_narrow = word_count > 15
        
        return {
            "is_question": is_question,
            "emotional_context": emotional_context,
            "detected_topics": detected_topics,
            "is_ambiguous": is_ambiguous,
            "is_too_broad": is_too_broad,
            "is_too_narrow": is_too_narrow,
            "word_count": word_count,
            "needs_clarification": is_too_broad or (is_ambiguous and len(detected_topics) > 1)
        }
    
    def generate_clarification_question(self, query: str, intent_analysis: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Generate a clarifying question based on query analysis
        
        Args:
            query: Original user query
            intent_analysis: Results from analyze_query_intent
            
        Returns:
            Clarification question and options, or None if not needed
        """
        if not intent_analysis["needs_clarification"]:
            return None
        
        topics = intent_analysis["detected_topics"]
        emotional_context = intent_analysis["emotional_context"]
        
        clarification = {
            "question": "",
            "options": [],
            "type": "topic_refinement"
        }
        
        if len(topics) > 1:
            # Multiple topics detected - ask for specificity
            clarification["question"] = f"I found several topics in your question. Which aspect interests you most?"
            clarification["options"] = [
                {"id": topic, "text": f"Verses about {topic}", "topic": topic}
                for topic in topics[:4]  # Limit to 4 options
            ]
            clarification["type"] = "topic_selection"
            
        elif len(topics) == 1:
            topic = topics[0]
            if topic in self.bible_topics:
                # Single topic but could be more specific
                variations = self.bible_topics[topic]
                clarification["question"] = f"What aspect of {topic} are you interested in?"
                clarification["options"] = [
                    {"id": f"{topic}_{i}", "text": var, "topic": topic, "subtopic": var}
                    for i, var in enumerate(variations[:4])
                ]
                clarification["type"] = "subtopic_selection"
        
        elif intent_analysis["is_too_broad"]:
            # Very broad query - suggest common topics
            clarification["question"] = "What topic would you like to explore in the Bible?"
            popular_topics = ["love", "faith", "peace", "hope", "forgiveness", "strength"]
            clarification["options"] = [
                {"id": topic, "text": f"Verses about {topic}", "topic": topic}
                for topic in popular_topics
            ]
            clarification["type"] = "topic_suggestion"
        
        # Add emotional context options if detected
        if emotional_context:
            context = emotional_context[0]
            clarification["question"] += f" Are you looking for {context}?"
            clarification["emotional_context"] = context
        
        return clarification if clarification["question"] else None
    
    def learn_from_interaction(self, session_id: str, original_query: str, 
                             refined_query: str, results_count: int, 
                             user_feedback: Optional[str] = None):
        """
        Learn from user interactions to improve future suggestions
        
        Args:
            session_id: User session identifier
            original_query: Original user query
            refined_query: Query after clarification/refinement
            results_count: Number of results returned
            user_feedback: Optional user feedback (positive/negative)
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Store conversation
        cursor.execute('''
            INSERT INTO conversations 
            (session_id, timestamp, user_query, refined_query, results_count, user_feedback)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, datetime.now(), original_query, refined_query, results_count, user_feedback))
        
        # Update or create query pattern
        if refined_query != original_query and results_count > 0:
            # Check if pattern exists
            cursor.execute('''
                SELECT id, usage_count FROM query_patterns 
                WHERE original_query = ? AND successful_refinement = ?
            ''', (original_query, refined_query))
            
            existing = cursor.fetchone()
            if existing:
                # Update existing pattern
                cursor.execute('''
                    UPDATE query_patterns 
                    SET usage_count = usage_count + 1, last_used = ?
                    WHERE id = ?
                ''', (datetime.now(), existing[0]))
            else:
                # Create new pattern
                topic = self._extract_topic_from_query(refined_query)
                cursor.execute('''
                    INSERT INTO query_patterns 
                    (original_query, successful_refinement, topic_category, last_used)
                    VALUES (?, ?, ?, ?)
                ''', (original_query, refined_query, topic, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def get_learned_suggestions(self, query: str) -> List[str]:
        """
        Get suggestions based on learned patterns from previous interactions
        
        Args:
            query: User's current query
            
        Returns:
            List of suggested refined queries
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Find similar queries that were successfully refined
        cursor.execute('''
            SELECT successful_refinement, usage_count
            FROM query_patterns
            WHERE original_query LIKE ? OR successful_refinement LIKE ?
            ORDER BY usage_count DESC, last_used DESC
            LIMIT 5
        ''', (f'%{query}%', f'%{query}%'))
        
        suggestions = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return suggestions
    
    def _extract_topic_from_query(self, query: str) -> str:
        """Extract the main topic from a query"""
        query_lower = query.lower()
        for topic in self.bible_topics.keys():
            if topic in query_lower:
                return topic
        return "general"
    
    def should_ask_clarification(self, session_id: str, query: str) -> bool:
        """
        Determine if clarification should be asked based on user preferences and history
        
        Args:
            session_id: User session ID
            query: Current query
            
        Returns:
            True if clarification should be asked
        """
        # Check user preferences
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT clarification_frequency FROM user_preferences 
            WHERE session_id = ?
        ''', (session_id,))
        
        result = cursor.fetchone()
        if result and result[0] == 'never':
            conn.close()
            return False
        
        # Check recent clarification history to avoid being annoying
        cursor.execute('''
            SELECT COUNT(*) FROM conversations 
            WHERE session_id = ? AND clarification_asked = TRUE 
            AND timestamp > datetime('now', '-1 hour')
        ''', (session_id,))
        
        recent_clarifications = cursor.fetchone()[0]
        conn.close()
        
        # Don't ask too many clarifications in a short time
        return recent_clarifications < 3
    
    def update_user_preferences(self, session_id: str, preferences: Dict[str, Any]):
        """Update user preferences based on their interactions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO user_preferences 
            (session_id, preferred_topics, search_style, clarification_frequency, last_interaction)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            session_id,
            json.dumps(preferences.get('preferred_topics', [])),
            preferences.get('search_style', 'balanced'),
            preferences.get('clarification_frequency', 'sometimes'),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()