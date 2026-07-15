#!/usr/bin/env python3
"""
Startup script for RPV Bible AI Backend
Handles both mock and real versions depending on dependencies
"""

import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if ML dependencies are available"""
    try:
        import sentence_transformers
        import chromadb
        return True
    except ImportError:
        return False

def start_mock_server():
    """Start the mock server for testing"""
    logger.info("Starting RPV Bible AI Backend (Mock Version)")
    logger.info("This version uses mock data for testing without ML dependencies")
    
    # Import and run the mock test
    from main_mock import test_full_system
    import asyncio
    
    try:
        asyncio.run(test_full_system())
        logger.info("Mock server test completed successfully!")
        logger.info("To start the actual API server, install ML dependencies:")
        logger.info("pip install sentence-transformers chromadb")
    except Exception as e:
        logger.error(f"Mock server failed: {e}")

def start_real_server():
    """Start the real FastAPI server"""
    logger.info("Starting RPV Bible AI Backend (Full Version)")
    
    try:
        import uvicorn
        from main import app
        
        logger.info("Starting FastAPI server on http://localhost:8000")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start real server: {e}")
        logger.info("Falling back to mock version...")
        start_mock_server()

if __name__ == "__main__":
    print("🚀 RPV Bible AI Backend Startup")
    print("=" * 50)
    
    # Check if we have ML dependencies
    has_ml_deps = check_dependencies()
    
    if has_ml_deps:
        print("✅ ML dependencies found - starting full server")
        start_real_server()
    else:
        print("⚠️  ML dependencies not found - starting mock version")
        print("   Install with: pip install sentence-transformers chromadb")
        start_mock_server()