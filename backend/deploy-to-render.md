# Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/rpv-bible)

## Quick Deploy Steps

1. **Click the "Deploy to Render" button above**
2. **Connect your GitHub account**
3. **Configure the service**:
   - **Name**: `rpv-bible-ai-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main_production.py`
   - **Plan**: Free

4. **Deploy and wait** for the build to complete
5. **Copy the service URL** (e.g., `https://rpv-bible-ai-backend.onrender.com`)
6. **Update your frontend** `.env.local` file:
   ```bash
   BIBLE_API_URL=https://rpv-bible-ai-backend.onrender.com
   ```
7. **Redeploy your frontend** to Firebase

## Alternative: Manual Render Deploy

If the one-click deploy doesn't work:

1. Go to [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Use these settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main_production.py`
   - **Python Version**: 3.11.0

## Testing Your Deployment

Visit: `https://your-service-url.onrender.com/health`

You should see:
```json
{
  "status": "healthy",
  "message": "RPV Bible AI Assistant is running (Mock mode)",
  "backend_type": "mock",
  "ml_available": false
}
```

## Update Frontend

Update your `.env.local`:
```bash
BIBLE_API_URL=https://your-service-url.onrender.com
```

Then redeploy:
```bash
firebase deploy --only hosting
```

Your AI Bible search will now be fully functional with a live backend!