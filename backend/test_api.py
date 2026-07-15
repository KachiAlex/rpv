#!/usr/bin/env python3
"""
Test script for RPV Bible Search API
"""

import asyncio
import json
import time
from search import BibleSearchEngine

async def test_search_engine():
    """Test the search engine functionality"""
    print("🔍 Testing RPV Bible Search Engine")
    print("=" * 50)
    
    # Initialize search engine
    print("Initializing search engine...")
    engine = BibleSearchEngine()
    
    try:
        await engine.initialize()
        print("✅ Search engine initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return
    
    # Test queries
    test_queries = [
        "What does the Bible say about anxiety?",
        "God's love for the world",
        "comfort in difficult times",
        "shepherd psalm",
        "fear not"
    ]
    
    print(f"\n🧪 Testing {len(test_queries)} search queries:")
    print("-" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Query: '{query}'")
        
        try:
            start_time = time.time()
            results = await engine.search(query, limit=3)
            search_time = time.time() - start_time
            
            print(f"   ⏱️  Search time: {search_time*1000:.1f}ms")
            print(f"   📊 Results found: {len(results['verses'])}")
            
            for j, verse in enumerate(results['verses'], 1):
                relevance = verse['relevance_score'] * 100
                print(f"   {j}. {verse['book']} {verse['chapter']}:{verse['verse']} ({relevance:.1f}%)")
                print(f"      \"{verse['text'][:80]}...\"")
                
        except Exception as e:
            print(f"   ❌ Search failed: {e}")
    
    # Get stats
    print(f"\n📈 Search Engine Statistics:")
    print("-" * 30)
    stats = await engine.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print(f"\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(test_search_engine())