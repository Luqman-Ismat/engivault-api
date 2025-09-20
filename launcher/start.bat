@echo off
echo 🚀 Starting ENGiVAULT Launcher...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the launcher directory
    echo 💡 Try: cd launcher
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies first...
    npm install
)

REM Start the launcher
echo 🎉 Launching ENGiVAULT Installer...
npm run dev

pause
