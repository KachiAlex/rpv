#!/usr/bin/env python3
"""
RPV Bible Search API Startup Script
"""

import asyncio
import logging
import sys
import os
from embed import initialize_embeddings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def main():
    """Main startup function"""
    logger.info("Starting RPV Bible Search API...")
    
    # Check if Bible data exists
    if not os.path.exists("bible.json"):
        logger.error("bible.json not found! Please ensure the Bible data file exists.")
        sys.exit(1)
    
    # Initialize embeddings
    logger.info("Initializing embeddings...")
    success = await initialize_embeddings()
    
    if not success:
        logger.error("Failed to initialize embeddings")
        sys.exit(1)
    
    logger.info("Embeddings initialized successfully!")
    logger.info("Starting FastAPI server...")
    
    # Import and run the FastAPI app
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    asyncio.run(main())