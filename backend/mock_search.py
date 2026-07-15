"""
Mock Bible Search Engine for testing without ML dependencies
"""

import logging
import time
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class MockBibleSearchEngine:
    def __init__(self, model_name: str = "mock-model"):
        """
        Initialize the mock Bible search engine
        """
        self.model_name = model_name
        self.ready = False
        
        # Sample Bible verses for testing
        self.sample_verses = [
            {
                "book": "Matthew",
                "chapter": 6,
                "verse": 25,
                "text": "Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment?"
            },
            {
                "book": "Philippians", 
                "chapter": 4,
                "verse": 6,
                "text": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God."
            },
            {
                "book": "Philippians",
                "chapter": 4, 
                "verse": 7,
                "text": "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus."
            },
            {
                "book": "Isaiah",
                "chapter": 41,
                "verse": 10,
                "text": "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness."
            },
            {
                "book": "John",
                "chapter": 3,
                "verse": 16,
                "text": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
            },
            {
                "book": "Romans",
                "chapter": 8,
                "verse": 28,
                "text": "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."
            },
            {
                "book": "Psalm",
                "chapter": 23,
                "verse": 1,
                "text": "The LORD is my shepherd; I shall not want."
            },
            {
                "book": "1 Corinthians",
                "chapter": 13,
                "verse": 4,
                "text": "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,"
            }
        ]
        
    async def initialize(self):
        """Initialize the mock search engine"""
        try:
            logger.info("Initializing Mock Bible Search Engine...")
            # Simulate initialization time
            time.sleep(0.1)
            self.ready = True
            logger.info(f"Mock search engine ready with {len(self.sample_verses)} sample verses")
        except Exception as e:
            logger.error(f"Failed to initialize mock search engine: {e}")
            self.ready = False
            raise
    
    def is_ready(self) -> bool:
        """Check if the search engine is ready"""
        return self.ready
    
    async def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Mock search for Bible verses using keyword matching
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            
        Returns:
            Dictionary containing search results and metadata
        """
        if not self.is_ready():
            raise Exception("Mock search engine not ready")
            
        start_time = time.time()
        
        try:
            query_lower = query.lower()
            
            # Simple keyword matching for demo
            matching_verses = []
            
            # Define keyword mappings for better results
            keyword_mappings = {
                'anxiety': ['careful', 'fear', 'peace'],
                'worry': ['careful', 'fear', 'peace'],
                'fear': ['fear', 'afraid', 'dismayed'],
                'love': ['love', 'charity'],
                'peace': ['peace'],
                'comfort': ['peace', 'shepherd', 'comfort'],
                'strength': ['strengthen', 'help', 'uphold'],
                'hope': ['hope', 'good'],
                'god': ['god', 'lord'],
                'jesus': ['son', 'christ'],
                'faith': ['believeth', 'faith'],
                'forgiveness': ['forgive'],
                'salvation': ['perish', 'everlasting']
            }
            
            # Find relevant keywords
            search_keywords = []
            for key, keywords in keyword_mappings.items():
                if key in query_lower:
                    search_keywords.extend(keywords)
            
            # If no specific keywords found, use query words directly
            if not search_keywords:
                search_keywords = query_lower.split()
            
            # Score verses based on keyword matches
            for verse in self.sample_verses:
                verse_text_lower = verse['text'].lower()
                score = 0
                
                for keyword in search_keywords:
                    if keyword in verse_text_lower:
                        score += 1
                
                # Add some randomness for variety
                if score > 0 or len(search_keywords) == 0:
                    # Calculate relevance score (0-1)
                    relevance_score = min(1.0, (score + 0.1) / len(search_keywords) if search_keywords else 0.5)
                    
                    matching_verses.append({
                        "book": verse['book'],
                        "chapter": verse['chapter'], 
                        "verse": verse['verse'],
                        "text": verse['text'],
                        "relevance_score": round(relevance_score, 4)
                    })
            
            # Sort by relevance score (highest first)
            matching_verses.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            # Limit results
            matching_verses = matching_verses[:limit]
            
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            return {
                "verses": matching_verses,
                "processing_time_ms": round(processing_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Mock search error: {e}")
            raise
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get mock search engine statistics"""
        if not self.is_ready():
            return {"error": "Mock search engine not ready"}
            
        try:
            return {
                "status": "ready",
                "total_verses": len(self.sample_verses),
                "model": self.model_name,
                "collection_name": "mock_bible_verses",
                "note": "This is a mock search engine for testing"
            }
        except Exception as e:
            return {"error": str(e)}