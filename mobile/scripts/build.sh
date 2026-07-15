#!/bin/bash

# RPV Bible APK Build Script

set -e

echo "🔨 Building RPV Bible APK..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Install it with: npm install -g eas-cli"
    exit 1
fi

# Get build type from argument
BUILD_TYPE=${1:-preview}

echo "📦 Building for: $BUILD_TYPE"

# Build the APK
case $BUILD_TYPE in
    development)
        echo "🚀 Building development APK..."
        eas build --platform android --profile development
        ;;
    preview)
        echo "🚀 Building preview APK..."
        eas build --platform android --profile preview
        ;;
    production)
        echo "🚀 Building production APK..."
        eas build --platform android --profile production
        ;;
    *)
        echo "❌ Unknown build type: $BUILD_TYPE"
        echo "Usage: ./build.sh [development|preview|production]"
        exit 1
        ;;
esac

echo "✅ Build complete!"
echo "📱 Check your EAS dashboard for build status"
