#!/usr/bin/env python3
"""
Deploy RPV Bible AI Backend to Railway
"""

import subprocess
import sys
import os

def check_railway_cli():
    """Check if Railway CLI is installed"""
    try:
        result = subprocess.run(['railway', '--version'], capture_output=True, text=True)
        print(f"✅ Railway CLI found: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ Railway CLI not found")
        print("Install it with: npm install -g @railway/cli")
        print("Or visit: https://railway.app/cli")
        return False

def deploy_to_railway():
    """Deploy to Railway"""
    print("🚀 Deploying RPV Bible AI Backend to Railway...")
    
    if not check_railway_cli():
        return False
    
    try:
        # Login check
        print("\n1. Checking Railway login...")
        result = subprocess.run(['railway', 'whoami'], capture_output=True, text=True)
        if result.returncode != 0:
            print("Please login to Railway first:")
            print("railway login")
            return False
        
        print(f"✅ Logged in as: {result.stdout.strip()}")
        
        # Initialize project if needed
        print("\n2. Initializing Railway project...")
        if not os.path.exists('.railway'):
            subprocess.run(['railway', 'init'], check=True)
        
        # Deploy
        print("\n3. Deploying to Railway...")
        result = subprocess.run(['railway', 'up'], check=True, capture_output=True, text=True)
        
        print("✅ Deployment successful!")
        print("\n4. Getting deployment URL...")
        
        # Get the URL
        url_result = subprocess.run(['railway', 'domain'], capture_output=True, text=True)
        if url_result.returncode == 0 and url_result.stdout.strip():
            url = url_result.stdout.strip()
            print(f"🌐 Backend URL: {url}")
            print(f"\n📝 Update your .env.local file:")
            print(f"BIBLE_API_URL={url}")
        else:
            print("⚠️  No custom domain set. Use Railway dashboard to get the URL.")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed: {e}")
        return False
    except KeyboardInterrupt:
        print("\n⚠️  Deployment cancelled by user")
        return False

if __name__ == "__main__":
    print("🚀 Railway Deployment Script for RPV Bible AI Backend")
    print("=" * 60)
    
    success = deploy_to_railway()
    
    if success:
        print("\n🎉 Deployment Complete!")
        print("\nNext steps:")
        print("1. Update BIBLE_API_URL in your .env.local file")
        print("2. Redeploy your frontend to Firebase")
        print("3. Test the AI Bible search with the live backend")
    else:
        print("\n❌ Deployment failed. Please check the errors above.")
    
    sys.exit(0 if success else 1)