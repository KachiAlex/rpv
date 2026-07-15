# RPV Bible AI Backend - Deployment Guide

## 🚀 **Quick Deploy Options**

### **Option 1: Railway (Recommended)**
Railway automatically handles Python dependencies and provides a free tier.

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy**:
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Get URL**:
   ```bash
   railway domain
   ```

### **Option 2: Render**
Render also provides free hosting with automatic dependency management.

1. **Create account**: https://render.com
2. **Connect GitHub repo**
3. **Select backend folder**
4. **Use these settings**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main_production.py`
   - **Environment**: Python 3.11

### **Option 3: Heroku**
Classic platform with good Python support.

1. **Install Heroku CLI**
2. **Create Procfile**:
   ```
   web: python main_production.py
   ```
3. **Deploy**:
   ```bash
   heroku create rpv-bible-ai
   git push heroku main
   ```

## 🔧 **Configuration**

### **Environment Variables**
Set these in your deployment platform:

```bash
PORT=8000                    # Port for the server
PYTHON_VERSION=3.11.0       # Python version
```

### **Frontend Configuration**
Update your `.env.local` file with the deployed backend URL:

```bash
# Replace with your actual deployment URL
BIBLE_API_URL=https://your-backend-url.railway.app
```

## 🧪 **Testing Deployment**

### **Health Check**
Visit: `https://your-backend-url/health`

Expected response:
```json
{
  "status": "healthy",
  "message": "RPV Bible AI Assistant is running (Mock mode)",
  "embeddings_loaded": true,
  "conversation_ready": true,
  "backend_type": "mock",
  "ml_available": false
}
```

### **Search Test**
Visit: `https://your-backend-url/search?q=love`

Expected response:
```json
{
  "query": "love",
  "results": [...],
  "total_results": 2,
  "processing_time_ms": 5.2,
  "backend_type": "mock",
  "session_id": "..."
}
```

## 📊 **Backend Modes**

### **Mock Mode (Default)**
- Uses sample Bible verses (8 verses)
- All conversational AI features work
- Fast deployment without ML dependencies
- Perfect for testing and demo

### **Full ML Mode**
- Requires ML dependencies to be installed
- Uses semantic search with embeddings
- Complete Bible dataset (31,000+ verses)
- Production-ready for full deployment

## 🔄 **Upgrading to Full ML**

Once deployed in mock mode, you can upgrade:

1. **Add ML dependencies** to requirements.txt (already included)
2. **Redeploy** - platform will install ML libraries
3. **Backend automatically switches** to ML mode
4. **First startup** takes 5-10 minutes to generate embeddings
5. **Subsequent startups** are instant

## 🛠️ **Troubleshooting**

### **Deployment Fails**
- Check Python version (3.11 recommended)
- Verify requirements.txt is present
- Check platform-specific logs

### **Backend Returns Errors**
- Check health endpoint first
- Verify CORS settings for your domain
- Check server logs for detailed errors

### **Frontend Can't Connect**
- Verify BIBLE_API_URL in .env.local
- Check CORS configuration in backend
- Test backend URL directly in browser

## 🎯 **Production Checklist**

- [ ] Backend deployed and health check passes
- [ ] Frontend .env.local updated with backend URL
- [ ] Frontend redeployed to Firebase
- [ ] AI Bible search page accessible
- [ ] Search functionality working
- [ ] Conversational features active
- [ ] Error handling graceful

## 🌐 **Expected URLs**

After deployment, you'll have:

- **Backend API**: `https://your-backend-url.railway.app`
- **Health Check**: `https://your-backend-url.railway.app/health`
- **API Docs**: `https://your-backend-url.railway.app/docs`
- **Frontend**: `https://redemptionprojectversion.web.app/bible-search`

## 🎉 **Success!**

Once deployed, your AI Bible search will be fully functional with:
- ✅ Live backend API
- ✅ Conversational AI features
- ✅ Learning system active
- ✅ Production-ready performance
- ✅ Automatic scaling and reliability