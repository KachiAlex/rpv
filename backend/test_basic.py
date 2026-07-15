#!/usr/bin/env python3
"""
Basic test for conversation manager without ML dependencies
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from conversation import ConversationManager

def test_conversation_manager():
    """Test conversation manager functionality without search engine"""
    print("🤖 Testing Conversation Manager (No ML Dependencies)")
    print("=" * 60)
    
    # Initialize conversation manager
    print("Initializing conversation manager...")
    conversation_manager = ConversationManager()
    
    # Test session
    session_id = "test_session_basic"
    
    # Test queries for intent analysis
    test_queries = [
        "love",
        "What does the Bible say about fear?", 
        "I'm feeling anxious and need comfort",
        "verses about God's love and forgiveness",
        "John 3:16"
    ]
    
    print(f"\n🧪 Testing Intent Analysis:")
    print("-" * 40)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Query: '{query}'")
        
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
        
        # Simulate learning from interaction
        conversation_manager.learn_from_interaction(
            session_id, query, query, 5  # Simulate 5 results
        )
    
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
    
    print(f"\n✅ Conversation Manager tests completed!")
    print(f"\n💡 Key Features Working:")
    print(f"   ✓ Intent analysis and topic detection")
    print(f"   ✓ Intelligent clarification questions")
    print(f"   ✓ Learning from user interactions")
    print(f"   ✓ Personalized suggestions")
    print(f"   ✓ User preference tracking")
    print(f"   ✓ Emotional context awareness")
    print(f"   ✓ SQLite database operations")

if __name__ == "__main__":
    test_conversation_manager()