"""
Bible Search Engine
Handles semantic search queries using ChromaDB and sentence transformers
"""

import logging
import time
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import chromadb
from embed import BibleEmbedder

logger = logging.getLogger(__name__)

class BibleSearchEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the Bible search engine
        
        Args:
            model_name: Name of the sentence transformer model
        """
        self.model_name = model_name
        self.model = None
        self.chroma_client = None
        self.collection = None
        self.ready = False
        
    async def initialize(self):
        """Initialize the search engine"""
        try:
            logger.info("Initializing Bible Search Engine...")
            
            # Load the sentence transformer model
            logger.info(f"Loading model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            
            # Setup ChromaDB connection
            self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
            
            try:
                self.collection = self.chroma_client.get_collection(name="bible_verses")
                logger.info("Connected to existing Bible verses collection")
            except:
                logger.info("Bible verses collection not found. Initializing embeddings...")
                # Initialize embeddings if collection doesn't exist
                embedder = BibleEmbedder(self.model_name)
                embedder.load_model()
                embedder.load_bible_data()
                embedder.setup_chromadb()
                embedder.generate_embeddings()
                
                # Reconnect to the newly created collection
                self.collection = self.chroma_client.get_collection(name="bible_verses")
            
            # Verify collection has data
            count = self.collection.count()
            if count == 0:
                raise Exception("Bible verses collection is empty")
                
            logger.info(f"Search engine ready with {count} Bible verses")
            self.ready = True
            
        except Exception as e:
            logger.error(f"Failed to initialize search engine: {e}")
            self.ready = False
            raise
    
    def is_ready(self) -> bool:
        """Check if the search engine is ready"""
        return self.ready and self.model is not None and self.collection is not None
    
    async def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for Bible verses using semantic similarity
        
        Args:
            query: Natural language search query
            limit: Maximum number of results to return
            
        Returns:
            Dictionary containing search results and metadata
        """
        if not self.is_ready():
            raise Exception("Search engine not ready")
            
        start_time = time.time()
        
        try:
            # Generate embedding for the query
            query_embedding = self.model.encode([query], convert_to_tensor=False)[0]
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=limit,
                include=['metadatas', 'documents', 'distances']
            )
            
            # Process results
            verses = []
            if results['metadatas'] and len(results['metadatas'][0]) > 0:
                for i, metadata in enumerate(results['metadatas'][0]):
                    # Calculate relevance score (ChromaDB returns distances, lower is better)
                    distance = results['distances'][0][i]
                    relevance_score = max(0, 1 - distance)  # Convert to similarity score
                    
                    verse = {
                        "book": metadata['book'],
                        "chapter": metadata['chapter'],
                        "verse": metadata['verse'],
                        "text": metadata['text'],
                        "relevance_score": round(relevance_score, 4)
                    }
                    verses.append(verse)
            
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            return {
                "verses": verses,
                "processing_time_ms": round(processing_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            raise
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get search engine statistics"""
        if not self.is_ready():
            return {"error": "Search engine not ready"}
            
        try:
            count = self.collection.count()
            return {
                "status": "ready",
                "total_verses": count,
                "model": self.model_name,
                "collection_name": self.collection.name
            }
        except Exception as e:
            return {"error": str(e)}