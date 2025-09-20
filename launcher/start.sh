#!/bin/bash

# ENGiVAULT Launcher - Quick Start Script
echo "🚀 Starting ENGiVAULT Launcher..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the launcher directory"
    echo "💡 Try: cd /Users/luqmanismat/Documents/engivault-api/launcher"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

# Start the launcher
echo "🎉 Launching ENGiVAULT Installer..."
npm run dev
