"""
Bible Text Embedding Generator
Handles loading Bible data and generating embeddings using sentence-transformers
"""

import json
import logging
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os
import time

logger = logging.getLogger(__name__)

class BibleEmbedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the Bible embedder
        
        Args:
            model_name: Name of the sentence transformer model to use
        """
        self.model_name = model_name
        self.model = None
        self.chroma_client = None
        self.collection = None
        self.bible_data = []
        
    def load_model(self):
        """Load the sentence transformer model"""
        logger.info(f"Loading sentence transformer model: {self.model_name}")
        start_time = time.time()
        
        self.model = SentenceTransformer(self.model_name)
        
        load_time = time.time() - start_time
        logger.info(f"Model loaded in {load_time:.2f} seconds")
        
    def load_bible_data(self, bible_file: str = "bible.json") -> List[Dict[str, Any]]:
        """
        Load Bible data from JSON file
        
        Args:
            bible_file: Path to the Bible JSON file
            
        Returns:
            List of Bible verses
        """
        logger.info(f"Loading Bible data from {bible_file}")
        
        try:
            with open(bible_file, 'r', encoding='utf-8') as f:
                self.bible_data = json.load(f)
            
            logger.info(f"Loaded {len(self.bible_data)} Bible verses")
            return self.bible_data
            
        except FileNotFoundError:
            logger.error(f"Bible file not found: {bible_file}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Bible file: {e}")
            raise
            
    def setup_chromadb(self, persist_directory: str = "./chroma_db"):
        """
        Setup ChromaDB for vector storage
        
        Args:
            persist_directory: Directory to persist the database
        """
        logger.info(f"Setting up ChromaDB in {persist_directory}")
        
        # Ensure directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client with persistence
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)
        
        # Get or create collection
        collection_name = "bible_verses"
        try:
            self.collection = self.chroma_client.get_collection(name=collection_name)
            logger.info(f"Using existing collection: {collection_name}")
        except:
            self.collection = self.chroma_client.create_collection(
                name=collection_name,
                metadata={"description": "Bible verses with semantic embeddings"}
            )
            logger.info(f"Created new collection: {collection_name}")
            
    def generate_embeddings(self, batch_size: int = 100) -> bool:
        """
        Generate embeddings for all Bible verses
        
        Args:
            batch_size: Number of verses to process in each batch
            
        Returns:
            True if successful, False otherwise
        """
        if not self.model:
            logger.error("Model not loaded. Call load_model() first.")
            return False
            
        if not self.bible_data:
            logger.error("Bible data not loaded. Call load_bible_data() first.")
            return False
            
        if not self.collection:
            logger.error("ChromaDB not setup. Call setup_chromadb() first.")
            return False
            
        # Check if embeddings already exist
        existing_count = self.collection.count()
        if existing_count > 0:
            logger.info(f"Found {existing_count} existing embeddings. Skipping generation.")
            return True
            
        logger.info(f"Generating embeddings for {len(self.bible_data)} verses...")
        start_time = time.time()
        
        # Process in batches for memory efficiency
        for i in range(0, len(self.bible_data), batch_size):
            batch = self.bible_data[i:i + batch_size]
            batch_texts = []
            batch_ids = []
            batch_metadata = []
            
            for verse in batch:
                # Create searchable text combining verse content with context
                verse_text = verse['text']
                context_text = f"{verse['book']} {verse['chapter']}:{verse['verse']} - {verse_text}"
                
                batch_texts.append(context_text)
                batch_ids.append(f"{verse['book']}_{verse['chapter']}_{verse['verse']}")
                batch_metadata.append({
                    "book": verse['book'],
                    "chapter": verse['chapter'],
                    "verse": verse['verse'],
                    "text": verse_text
                })
            
            # Generate embeddings for batch
            embeddings = self.model.encode(batch_texts, convert_to_tensor=False)
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=embeddings.tolist(),
                documents=batch_texts,
                metadatas=batch_metadata,
                ids=batch_ids
            )
            
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(self.bible_data) + batch_size - 1)//batch_size}")
        
        total_time = time.time() - start_time
        logger.info(f"Generated embeddings for {len(self.bible_data)} verses in {total_time:.2f} seconds")
        
        return True
        
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the ChromaDB collection"""
        if not self.collection:
            return {"error": "Collection not initialized"}
            
        return {
            "total_verses": self.collection.count(),
            "collection_name": self.collection.name,
            "model_used": self.model_name
        }

async def initialize_embeddings():
    """
    Initialize embeddings if they don't exist
    This function can be called during app startup
    """
    embedder = BibleEmbedder()
    
    try:
        # Load model
        embedder.load_model()
        
        # Load Bible data
        embedder.load_bible_data()
        
        # Setup ChromaDB
        embedder.setup_chromadb()
        
        # Generate embeddings
        success = embedder.generate_embeddings()
        
        if success:
            stats = embedder.get_collection_stats()
            logger.info(f"Embeddings ready: {stats}")
            return True
        else:
            logger.error("Failed to generate embeddings")
            return False
            
    except Exception as e:
        logger.error(f"Error initializing embeddings: {e}")
        return False

if __name__ == "__main__":
    # Run embedding generation directly
    import asyncio
    asyncio.run(initialize_embeddings())