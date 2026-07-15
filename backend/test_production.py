#!/usr/bin/env python3
"""
Test the production backend locally
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_production_backend():
    """Test the production backend components"""
    print("🧪 Testing RPV Bible AI Production Backend")
    print("=" * 50)
    
    try:
        # Test conversation manager
        print("\n1. Testing Conversation Manager...")
        from conversation import ConversationManager
        conversation_manager = ConversationManager()
        
        # Test intent analysis
        intent = conversation_manager.analyze_query_intent("anxiety")
        print(f"   ✅ Intent analysis working: {intent['detected_topics']}")
        
        # Test mock search engine
        print("\n2. Testing Mock Search Engine...")
        from mock_search import MockBibleSearchEngine
        search_engine = MockBibleSearchEngine()
        await search_engine.initialize()
        
        results = await search_engine.search("love", limit=3)
        print(f"   ✅ Mock search working: {len(results['verses'])} verses found")
        
        # Test production main components
        print("\n3. Testing Production Components...")
        
        # Import without starting server
        import main_production
        print(f"   ✅ Production main imported successfully")
        print(f"   ✅ ML Available: {main_production.ML_AVAILABLE}")
        
        # Test health response model
        health = main_production.HealthResponse(
            status="healthy",
            message="Test",
            embeddings_loaded=True,
            conversation_ready=True,
            backend_type="mock",
            ml_available=False
        )
        print(f"   ✅ Health response model working")
        
        print("\n🎉 All Production Components Working!")
        print("\n📋 Deployment Status:")
        print(f"   • Conversation AI: ✅ Ready")
        print(f"   • Mock Search: ✅ Ready") 
        print(f"   • Production API: ✅ Ready")
        print(f"   • ML Dependencies: {'✅ Available' if main_production.ML_AVAILABLE else '⚠️  Mock Mode'}")
        
        print("\n🚀 Ready for Deployment!")
        print("   Choose a platform:")
        print("   • Railway: python quick_deploy.py")
        print("   • Render: See deploy-to-render.md")
        print("   • Heroku: See DEPLOYMENT_GUIDE.md")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_production_backend())
    sys.exit(0 if success else 1)