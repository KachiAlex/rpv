"""
RPV Bible AI Search Assistant - Production Version
FastAPI backend with graceful ML dependency handling
"""

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import uuid
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import ML dependencies, fall back to mock if not available
try:
    from search import BibleSearchEngine
    ML_AVAILABLE = True
    logger.info("ML dependencies available - using real search engine")
except ImportError as e:
    from mock_search import MockBibleSearchEngine as BibleSearchEngine
    ML_AVAILABLE = False
    logger.warning(f"ML dependencies not available ({e}) - using mock search engine")

from conversation import ConversationManager

# Initialize FastAPI app
app = FastAPI(
    title="RPV Bible Search API",
    description="AI-powered semantic search for Bible verses with conversational learning",
    version="2.0.0-production"
)

# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://redemptionprojectversion.web.app",
        "https://redemptionprojectversion.firebaseapp.com",
        "http://localhost:3000",  # For local development
        "http://127.0.0.1:3000"   # For local development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Response models
class BibleVerse(BaseModel):
    book: str
    chapter: int
    verse: int
    text: str
    relevance_score: Optional[float] = None

class ClarificationOption(BaseModel):
    id: str
    text: str
    topic: Optional[str] = None
    subtopic: Optional[str] = None

class ClarificationQuestion(BaseModel):
    question: str
    options: List[ClarificationOption]
    type: str
    emotional_context: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    results: List[BibleVerse]
    total_results: int
    processing_time_ms: float
    clarification: Optional[ClarificationQuestion] = None
    suggestions: Optional[List[str]] = None
    session_id: str
    backend_type: str  # "ml" or "mock"

class FeedbackRequest(BaseModel):
    session_id: str
    query: str
    feedback: str  # "helpful", "not_helpful", "partially_helpful"
    selected_verses: Optional[List[int]] = None

class ClarificationResponse(BaseModel):
    session_id: str
    original_query: str
    selected_option_id: str
    additional_context: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    message: str
    embeddings_loaded: bool
    conversation_ready: bool
    backend_type: str
    ml_available: bool

# Initialize engines
search_engine = None
conversation_manager = None

@app.on_event("startup")
async def startup_event():
    """Initialize the Bible search engine and conversation manager on startup"""
    global search_engine, conversation_manager
    try:
        logger.info("Initializing Bible Search Engine...")
        search_engine = BibleSearchEngine()
        await search_engine.initialize()
        
        logger.info("Initializing Conversation Manager...")
        conversation_manager = ConversationManager()
        
        backend_type = "ML-powered" if ML_AVAILABLE else "Mock (for testing)"
        logger.info(f"RPV Bible AI Assistant ({backend_type}) initialized successfully!")
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message=f"RPV Bible AI Assistant is running ({'ML-powered' if ML_AVAILABLE else 'Mock mode'})",
        embeddings_loaded=search_engine is not None and search_engine.is_ready(),
        conversation_ready=conversation_manager is not None,
        backend_type="ml" if ML_AVAILABLE else "mock",
        ml_available=ML_AVAILABLE
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check"""
    if search_engine is None or conversation_manager is None:
        return HealthResponse(
            status="error",
            message="Services not initialized",
            embeddings_loaded=False,
            conversation_ready=False,
            backend_type="unknown",
            ml_available=ML_AVAILABLE
        )
    
    return HealthResponse(
        status="healthy" if search_engine.is_ready() else "loading",
        message="All services ready" if search_engine.is_ready() else "Services initializing",
        embeddings_loaded=search_engine.is_ready(),
        conversation_ready=True,
        backend_type="ml" if ML_AVAILABLE else "mock",
        ml_available=ML_AVAILABLE
    )

@app.get("/search", response_model=SearchResponse)
async def search_bible(
    q: str = Query(..., description="Search query for Bible verses"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    Search Bible verses using semantic similarity with conversational AI
    """
    if search_engine is None or not search_engine.is_ready():
        raise HTTPException(
            status_code=503, 
            detail="Search engine not ready. Please try again in a moment."
        )
    
    if not q or len(q.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Query must be at least 2 characters long"
        )
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        # Analyze query intent
        intent_analysis = conversation_manager.analyze_query_intent(q.strip())
        
        # Check if we should ask for clarification
        clarification = None
        if (conversation_manager.should_ask_clarification(session_id, q.strip()) and 
            intent_analysis["needs_clarification"]):
            clarification = conversation_manager.generate_clarification_question(q.strip(), intent_analysis)
        
        # Get learned suggestions
        suggestions = conversation_manager.get_learned_suggestions(q.strip())
        
        # Perform semantic search
        results = await search_engine.search(q.strip(), limit=limit)
        
        # Log interaction for learning
        conversation_manager.learn_from_interaction(
            session_id, q.strip(), q.strip(), len(results["verses"])
        )
        
        return SearchResponse(
            query=q.strip(),
            results=results["verses"],
            total_results=len(results["verses"]),
            processing_time_ms=results["processing_time_ms"],
            clarification=clarification,
            suggestions=suggestions[:3] if suggestions else None,
            session_id=session_id,
            backend_type="ml" if ML_AVAILABLE else "mock"
        )
        
    except Exception as e:
        logger.error(f"Search error for query '{q}': {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while searching. Please try again."
        )

@app.post("/clarify")
async def handle_clarification(clarification: ClarificationResponse):
    """Handle user's response to clarification question"""
    if search_engine is None or not search_engine.is_ready():
        raise HTTPException(status_code=503, detail="Search engine not ready")
    
    try:
        # Build refined query based on selected option
        refined_query = clarification.original_query
        
        # Add context from selected option
        if clarification.additional_context:
            refined_query += f" {clarification.additional_context}"
        
        # Perform refined search
        results = await search_engine.search(refined_query, limit=10)
        
        # Learn from this successful refinement
        conversation_manager.learn_from_interaction(
            clarification.session_id,
            clarification.original_query,
            refined_query,
            len(results["verses"]),
            "clarification_used"
        )
        
        return SearchResponse(
            query=refined_query,
            results=results["verses"],
            total_results=len(results["verses"]),
            processing_time_ms=results["processing_time_ms"],
            session_id=clarification.session_id,
            backend_type="ml" if ML_AVAILABLE else "mock"
        )
        
    except Exception as e:
        logger.error(f"Clarification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process clarification")

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit user feedback to improve search results"""
    try:
        # Store feedback for learning
        conversation_manager.learn_from_interaction(
            feedback.session_id,
            feedback.query,
            feedback.query,
            len(feedback.selected_verses) if feedback.selected_verses else 0,
            feedback.feedback
        )
        
        return {"message": "Thank you for your feedback! This helps improve our search."}
        
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process feedback")

@app.get("/suggestions/{session_id}")
async def get_personalized_suggestions(session_id: str):
    """Get personalized search suggestions based on user history"""
    try:
        suggestions = conversation_manager.get_learned_suggestions("")
        return {"suggestions": suggestions[:5]}
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        return {"suggestions": []}

@app.get("/stats")
async def get_stats():
    """Get search engine statistics"""
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    stats = await search_engine.get_stats()
    stats["ml_available"] = ML_AVAILABLE
    stats["backend_type"] = "ml" if ML_AVAILABLE else "mock"
    return stats

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main_production:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )