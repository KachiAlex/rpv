#!/usr/bin/env python3
"""
Quick deployment script for RPV Bible AI Backend
Provides multiple deployment options
"""

import webbrowser
import sys

def print_header():
    print("🚀 RPV Bible AI Backend - Quick Deploy")
    print("=" * 50)
    print()

def show_deployment_options():
    print("Choose your deployment platform:")
    print()
    print("1. 🚂 Railway (Recommended)")
    print("   - Free tier available")
    print("   - Automatic dependency management")
    print("   - Easy CLI deployment")
    print()
    print("2. 🎨 Render")
    print("   - Free tier available") 
    print("   - GitHub integration")
    print("   - One-click deploy")
    print()
    print("3. 🟣 Heroku")
    print("   - Classic platform")
    print("   - Good Python support")
    print("   - CLI deployment")
    print()
    print("4. 📖 View deployment guide")
    print("5. ❌ Exit")
    print()

def deploy_railway():
    print("🚂 Railway Deployment")
    print("-" * 30)
    print()
    print("Steps to deploy to Railway:")
    print("1. Install Railway CLI: npm install -g @railway/cli")
    print("2. Login: railway login")
    print("3. Navigate to backend folder: cd backend")
    print("4. Initialize: railway init")
    print("5. Deploy: railway up")
    print("6. Get URL: railway domain")
    print()
    print("Opening Railway website...")
    webbrowser.open("https://railway.app")

def deploy_render():
    print("🎨 Render Deployment")
    print("-" * 30)
    print()
    print("Steps to deploy to Render:")
    print("1. Go to render.com")
    print("2. Create new Web Service")
    print("3. Connect your GitHub repo")
    print("4. Set Root Directory: backend")
    print("5. Build Command: pip install -r requirements.txt")
    print("6. Start Command: python main_production.py")
    print()
    print("Opening Render website...")
    webbrowser.open("https://render.com")

def deploy_heroku():
    print("🟣 Heroku Deployment")
    print("-" * 30)
    print()
    print("Steps to deploy to Heroku:")
    print("1. Install Heroku CLI")
    print("2. Login: heroku login")
    print("3. Create app: heroku create rpv-bible-ai")
    print("4. Deploy: git push heroku main")
    print()
    print("Opening Heroku website...")
    webbrowser.open("https://heroku.com")

def show_guide():
    print("📖 Opening deployment guide...")
    print()
    print("The deployment guide is available in:")
    print("- backend/DEPLOYMENT_GUIDE.md")
    print("- backend/deploy-to-render.md")
    print()
    print("Key points:")
    print("✅ Backend works in mock mode immediately")
    print("✅ All conversational AI features functional")
    print("✅ Can upgrade to full ML later")
    print("✅ Free tier available on all platforms")

def main():
    print_header()
    
    while True:
        show_deployment_options()
        
        try:
            choice = input("Enter your choice (1-5): ").strip()
            print()
            
            if choice == "1":
                deploy_railway()
            elif choice == "2":
                deploy_render()
            elif choice == "3":
                deploy_heroku()
            elif choice == "4":
                show_guide()
            elif choice == "5":
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                continue
            
            print()
            print("🔄 After deployment:")
            print("1. Copy your backend URL")
            print("2. Update BIBLE_API_URL in .env.local")
            print("3. Redeploy frontend: firebase deploy --only hosting")
            print("4. Test: https://redemptionprojectversion.web.app/bible-search")
            print()
            
            continue_choice = input("Deploy another platform? (y/n): ").strip().lower()
            if continue_choice != 'y':
                break
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            continue
    
    print()
    print("🎉 Thanks for using RPV Bible AI Backend!")
    print("📚 Your AI Bible search system is ready to deploy!")

if __name__ == "__main__":
    main()