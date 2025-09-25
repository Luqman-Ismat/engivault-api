#!/bin/bash

# ENGiVAULT Launcher Build Script
# Builds cross-platform installers for Windows, macOS, and Linux

echo "🚀 Building ENGiVAULT Launcher..."
echo "======================================="

# Check if we're in the launcher directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the launcher directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build for current platform first (for testing)
echo "🔧 Building for current platform..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
    
    # Ask if user wants to build for all platforms
    read -p "🌍 Build for all platforms? (y/N): " build_all
    
    if [[ $build_all =~ ^[Yy]$ ]]; then
        echo "🌍 Building for all platforms..."
        npm run build:all
        
        if [ $? -eq 0 ]; then
            echo "✅ All platform builds successful!"
            echo ""
            echo "📦 Built installers:"
            echo "   Windows: dist/ENGiVAULT-Installer-1.0.0.exe"
            echo "   macOS:   dist/ENGiVAULT-Installer-1.0.0.dmg"
            echo "   Linux:   dist/ENGiVAULT-Installer-1.0.0.AppImage"
            echo ""
            echo "🎉 Ready for beta distribution!"
        else
            echo "❌ Multi-platform build failed"
            exit 1
        fi
    else
        echo "✅ Local build completed"
    fi
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Test the launcher: npm start"
echo "   2. Distribute to beta testers"
echo "   3. Collect feedback and iterate"
echo ""
echo "📋 Beta testing guide: ../BETA-TESTING.md"

