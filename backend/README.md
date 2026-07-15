# RPV Bible Search API

AI-powered semantic search for Bible verses using FastAPI, sentence-transformers, and ChromaDB.

## Features

- 🔍 **Semantic Search**: Natural language queries like "What does the Bible say about anxiety?"
- 🚀 **Fast & Lightweight**: Sub-500ms response times
- 📱 **Mobile Ready**: Optimized for mobile app integration
- 🔒 **Scripture Safe**: Only returns existing Bible verses, no hallucinations
- 💾 **Offline Capable**: No external API dependencies
- 🎯 **Accurate**: Uses sentence-transformers for precise semantic matching

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Prepare Bible Data

Ensure `bible.json` contains your Bible verses in this format:

```json
[
  {
    "book": "Matthew",
    "chapter": 6,
    "verse": 25,
    "text": "Therefore I say unto you, Take no thought for your life..."
  }
]
```

### 3. Start the API

```bash
python start.py
```

The API will:
- Load the sentence transformer model (`all-MiniLM-L6-v2`)
- Generate embeddings for all Bible verses
- Store embeddings in ChromaDB
- Start the FastAPI server on `http://localhost:8000`

## API Endpoints

### Search Bible Verses

```http
GET /search?q=What does the Bible say about anxiety?&limit=10
```

**Response:**
```json
{
  "query": "What does the Bible say about anxiety?",
  "results": [
    {
      "book": "Matthew",
      "chapter": 6,
      "verse": 25,
      "text": "Therefore I say unto you, Take no thought for your life...",
      "relevance_score": 0.8542
    }
  ],
  "total_results": 5,
  "processing_time_ms": 45.2
}
```

### Health Check

```http
GET /health
```

### Statistics

```http
GET /stats
```

## Integration with RPV Frontend

### Next.js API Route

Create `src/app/api/bible-search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const BIBLE_API_URL = process.env.BIBLE_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '10';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${BIBLE_API_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Search API error');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search Bible verses' }, 
      { status: 500 }
    );
  }
}
```

### React Component

```typescript
import { useState } from 'react';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  relevance_score?: number;
}

export function BibleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bible-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bible-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about any topic in the Bible..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className="search-results">
        {results.map((verse, index) => (
          <div key={index} className="verse-result">
            <div className="verse-reference">
              {verse.book} {verse.chapter}:{verse.verse}
            </div>
            <div className="verse-text">{verse.text}</div>
            {verse.relevance_score && (
              <div className="relevance-score">
                Relevance: {(verse.relevance_score * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Optimization

### Production Deployment

1. **Use a production WSGI server:**
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **Environment Variables:**
```bash
export BIBLE_API_HOST=0.0.0.0
export BIBLE_API_PORT=8000
export CHROMA_DB_PATH=/app/data/chroma_db
```

3. **Docker Deployment:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "start.py"]
```

### Scaling Considerations

- **Memory**: ~500MB for model + embeddings
- **CPU**: Multi-core recommended for concurrent requests
- **Storage**: ~100MB for ChromaDB with full Bible
- **Response Time**: <500ms for typical queries

## Security & Safety

### Scripture Safety Rules

✅ **Only returns existing Bible verses**  
✅ **No content generation or hallucination**  
✅ **Relevance scoring for accuracy**  
✅ **Query validation and sanitization**  

### Production Security

- Configure CORS origins properly
- Add rate limiting
- Use HTTPS in production
- Validate all inputs
- Monitor for abuse

## Troubleshooting

### Common Issues

1. **"Model not found" error:**
   - Ensure internet connection for initial model download
   - Model will be cached locally after first download

2. **"ChromaDB permission error":**
   - Ensure write permissions to `./chroma_db` directory

3. **Slow first startup:**
   - Initial embedding generation takes 1-2 minutes
   - Subsequent startups are fast (embeddings are cached)

4. **Memory issues:**
   - Reduce batch size in `embed.py`
   - Use smaller model like `all-MiniLM-L6-v2`

### Logs

Check logs for detailed error information:
```bash
tail -f /var/log/rpv-bible-api.log
```

## License

This API is part of the RPV Bible application project.