#!/usr/bin/env python3
"""
Test script for RPV Bible Search API with Conversational AI
"""

import asyncio
import json
import time
from conversation import ConversationManager
from search import BibleSearchEngine

async def test_conversational_ai():
    """Test the conversational AI functionality"""
    print("🤖 Testing RPV Bible Conversational AI")
    print("=" * 60)
    
    # Initialize components
    print("Initializing conversation manager...")
    conversation_manager = ConversationManager()
    
    print("Initializing search engine...")
    search_engine = BibleSearchEngine()
    await search_engine.initialize()
    
    # Test session
    session_id = "test_session_123"
    
    # Test queries that should trigger clarification
    test_scenarios = [
        {
            "query": "love",
            "description": "Ambiguous single word - should ask for clarification"
        },
        {
            "query": "What does the Bible say about fear?",
            "description": "Broad topic - should offer specific options"
        },
        {
            "query": "I'm feeling anxious and need comfort",
            "description": "Emotional context - should detect comfort need"
        },
        {
            "query": "verses about God's love and forgiveness",
            "description": "Multiple topics - should ask which to focus on"
        },
        {
            "query": "John 3:16",
            "description": "Specific reference - should not need clarification"
        }
    ]
    
    print(f"\n🧪 Testing {len(test_scenarios)} conversational scenarios:")
    print("-" * 60)
    
    for i, scenario in enumerate(test_scenarios, 1):
        query = scenario["query"]
        description = scenario["description"]
        
        print(f"\n{i}. Scenario: {description}")
        print(f"   Query: '{query}'")
        
        # Analyze intent
        intent_analysis = conversation_manager.analyze_query_intent(query)
        print(f"   🧠 Intent Analysis:")
        print(f"      - Is question: {intent_analysis['is_question']}")
        print(f"      - Detected topics: {intent_analysis['detected_topics']}")
        print(f"      - Emotional context: {intent_analysis['emotional_context']}")
        print(f"      - Needs clarification: {intent_analysis['needs_clarification']}")
        
        # Generate clarification if needed
        if intent_analysis["needs_clarification"]:
            clarification = conversation_manager.generate_clarification_question(query, intent_analysis)
            if clarification:
                print(f"   ❓ Clarification Question:")
                print(f"      {clarification['question']}")
                print(f"      Options:")
                for j, option in enumerate(clarification['options'], 1):
                    print(f"        {j}. {option['text']}")
        
        # Perform search
        try:
            results = await search_engine.search(query, limit=3)
            print(f"   📊 Search Results: {len(results['verses'])} verses found")
            
            for j, verse in enumerate(results['verses'], 1):
                relevance = verse['relevance_score'] * 100
                print(f"      {j}. {verse['book']} {verse['chapter']}:{verse['verse']} ({relevance:.1f}%)")
        except Exception as e:
            print(f"   ❌ Search failed: {e}")
        
        # Simulate learning from interaction
        conversation_manager.learn_from_interaction(
            session_id, query, query, len(results['verses']) if 'results' in locals() else 0
        )
        
        print()
    
    # Test learning capabilities
    print(f"\n🧠 Testing Learning Capabilities:")
    print("-" * 40)
    
    # Simulate user refining a query
    original_query = "comfort"
    refined_query = "comfort in times of grief and loss"
    
    print(f"Learning from refinement:")
    print(f"  Original: '{original_query}'")
    print(f"  Refined:  '{refined_query}'")
    
    conversation_manager.learn_from_interaction(
        session_id, original_query, refined_query, 5, "helpful"
    )
    
    # Test getting suggestions
    suggestions = conversation_manager.get_learned_suggestions("comfort")
    print(f"  Learned suggestions: {suggestions}")
    
    # Test user preferences
    print(f"\n⚙️  Testing User Preferences:")
    print("-" * 30)
    
    preferences = {
        "preferred_topics": ["comfort", "hope", "strength"],
        "search_style": "detailed",
        "clarification_frequency": "sometimes"
    }
    
    conversation_manager.update_user_preferences(session_id, preferences)
    print(f"Updated preferences for session: {session_id}")
    
    # Test clarification frequency logic
    should_ask = conversation_manager.should_ask_clarification(session_id, "new query")
    print(f"Should ask clarification for new query: {should_ask}")
    
    print(f"\n✅ All conversational AI tests completed!")
    print(f"\n💡 Key Features Demonstrated:")
    print(f"   - Intent analysis and topic detection")
    print(f"   - Intelligent clarification questions")
    print(f"   - Learning from user interactions")
    print(f"   - Personalized suggestions")
    print(f"   - User preference tracking")
    print(f"   - Emotional context awareness")

async def test_api_conversation_flow():
    """Test a complete conversation flow like the API would handle"""
    print(f"\n🔄 Testing Complete API Conversation Flow:")
    print("=" * 50)
    
    conversation_manager = ConversationManager()
    search_engine = BibleSearchEngine()
    await search_engine.initialize()
    
    session_id = "api_test_session"
    
    # Step 1: User asks broad question
    query1 = "anxiety"
    print(f"1. User Query: '{query1}'")
    
    intent = conversation_manager.analyze_query_intent(query1)
    clarification = conversation_manager.generate_clarification_question(query1, intent)
    
    if clarification:
        print(f"   AI Response: {clarification['question']}")
        for i, option in enumerate(clarification['options'], 1):
            print(f"   {i}. {option['text']}")
    
    # Step 2: User selects clarification
    print(f"\n2. User selects option 1 (simulated)")
    refined_query = "overcoming anxiety and worry"
    print(f"   Refined Query: '{refined_query}'")
    
    # Step 3: Perform refined search
    results = await search_engine.search(refined_query, limit=3)
    print(f"   Results: {len(results['verses'])} verses found")
    
    # Step 4: Learn from interaction
    conversation_manager.learn_from_interaction(
        session_id, query1, refined_query, len(results['verses']), "helpful"
    )
    
    # Step 5: Future query benefits from learning
    print(f"\n3. Future similar query:")
    future_query = "worry"
    suggestions = conversation_manager.get_learned_suggestions(future_query)
    print(f"   Query: '{future_query}'")
    print(f"   AI Suggestions based on learning: {suggestions}")
    
    print(f"\n✅ Complete conversation flow tested successfully!")

if __name__ == "__main__":
    asyncio.run(test_conversational_ai())
    asyncio.run(test_api_conversation_flow())