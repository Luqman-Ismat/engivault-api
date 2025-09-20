# EngiVault Cross-Platform Launcher

A comprehensive cross-platform installer for the EngiVault engineering calculations platform. This Electron-based application provides a user-friendly interface for installing:

- 🐍 **Python SDK** - Complete Python package with CLI tools
- 📦 **JavaScript/NPM Package** - TypeScript-ready NPM package
- 📊 **Excel Integration** - VBA modules and templates for Excel

## Features

### ✨ **User Experience**
- Beautiful, modern interface with progress tracking
- System requirements checking
- Customizable installation options
- Real-time installation progress with detailed logging
- Error handling and retry mechanisms

### 🔧 **Installation Components**
- **Python SDK**: Global or virtual environment installation with CLI tools
- **NPM Package**: Global or local installation with TypeScript definitions
- **Excel Integration**: VBA modules, templates, examples, and documentation

### 🌍 **Cross-Platform Support**
- **Windows**: Native installer with registry integration
- **macOS**: DMG installer with notarization support
- **Linux**: AppImage, DEB, and RPM packages

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for current platform
npm run build

# Build for all platforms
npm run build:all
```

### Production Build

```bash
# Build installers for all platforms
npm run dist

# Platform-specific builds
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Architecture

### Main Process (`main.js`)
- Electron main process handling system integration
- IPC communication with renderer process
- Installation orchestration and progress tracking

### Renderer Process (`renderer/`)
- Modern web-based UI with responsive design
- Real-time progress updates and system information
- Installation option configuration

### Installers (`src/installers/`)
- **`system-checker.js`** - Comprehensive system requirements checking
- **`python-installer.js`** - Python SDK installation with virtual environments
- **`npm-installer.js`** - NPM package installation with project setup
- **`excel-installer.js`** - Excel/LibreOffice integration setup

### Utilities (`src/utils/`)
- **`logger.js`** - Comprehensive logging with file rotation
- **`download.js`** - Download manager with progress tracking and retries

## Installation Options

### Python SDK Options
- ✅ **Global Installation** - Install system-wide using pip
- ✅ **Virtual Environment** - Create isolated Python environment
- ✅ **CLI Tools** - Include command-line interface
- ✅ **Development Extras** - Include dev dependencies and docs

### NPM Package Options
- ✅ **Global Installation** - Install globally with npm/yarn/pnpm
- ✅ **Local Project** - Create new project with package
- ✅ **TypeScript Support** - Include TypeScript definitions
- ✅ **Example Code** - Generate example files and documentation

### Excel Integration Options
- ✅ **VBA Modules** - Core calculation modules
- ✅ **Templates** - Pre-built Excel templates
- ✅ **Examples** - Sample workbooks and calculations
- ✅ **Documentation** - Complete function reference

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4 GB RAM
- **Storage**: 500 MB free space
- **Network**: Internet connection for package downloads

### For Python SDK
- **Python**: 3.8 or higher
- **pip**: Latest version recommended

### For NPM Package
- **Node.js**: 14.0 or higher
- **npm/yarn/pnpm**: Latest version recommended

### For Excel Integration
- **Windows**: Microsoft Excel 2013 or higher
- **macOS**: Microsoft Excel for Mac or LibreOffice Calc
- **Linux**: LibreOffice Calc 6.0 or higher

## Building and Distribution

### Code Signing (Production)
```bash
# Windows (requires certificate)
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"

# macOS (requires Apple Developer ID)
export CSC_IDENTITY_AUTO_DISCOVERY=true
```

### Distribution Channels
- **Direct Download** - GitHub Releases
- **Package Managers** - Chocolatey (Windows), Homebrew (macOS), Snap (Linux)
- **Enterprise** - Custom distribution packages

## Development

### Project Structure
```
launcher/
├── main.js                 # Electron main process
├── package.json           # Dependencies and build config
├── renderer/              # UI and frontend logic
│   ├── index.html         # Main application interface
│   ├── styles.css         # Modern, responsive styling
│   └── app.js            # Frontend application logic
├── src/
│   ├── installers/        # Installation modules
│   │   ├── system-checker.js
│   │   ├── python-installer.js
│   │   ├── npm-installer.js
│   │   └── excel-installer.js
│   └── utils/             # Utility modules
│       ├── logger.js
│       └── download.js
├── assets/                # Icons and resources
└── build/                 # Build configuration
```

### Adding New Installation Components

1. **Create Installer Module**
```javascript
// src/installers/my-installer.js
class MyInstaller {
  async install(options, progressCallback) {
    // Implementation
  }
}
module.exports = MyInstaller;
```

2. **Register in Main Process**
```javascript
// main.js
const MyInstaller = require('./src/installers/my-installer');
this.myInstaller = new MyInstaller();
```

3. **Add IPC Handler**
```javascript
ipcMain.handle('install-my-component', async (event, options) => {
  return await this.myInstaller.install(options, progressCallback);
});
```

4. **Update UI**
- Add option card in `renderer/index.html`
- Add event handlers in `renderer/app.js`
- Update progress tracking

### Testing

```bash
# Run in development mode
npm run dev

# Test on different platforms
npm run build:win
npm run build:mac
npm run build:linux

# Manual testing
npm start
```

## Security Considerations

### Code Signing
- All production builds are code-signed
- Windows: Authenticode certificate
- macOS: Apple Developer ID certificate
- Linux: GPG signatures

### Permissions
- Minimal required permissions
- No admin rights required for user installations
- Secure download verification

### Privacy
- No telemetry or user tracking
- Local installation logs only
- Optional error reporting

## Troubleshooting

### Common Issues

**Installation Fails**
- Check internet connection
- Verify system requirements
- Run as administrator (Windows) if needed
- Check available disk space

**Python Installation Issues**
- Ensure Python 3.8+ is installed
- Check pip is available and updated
- Verify virtual environment creation permissions

**NPM Installation Issues**
- Update Node.js to latest LTS version
- Clear npm cache: `npm cache clean --force`
- Check npm registry connectivity

**Excel Integration Issues**
- Verify Excel/LibreOffice is installed
- Enable macros in spreadsheet application
- Check VBA module import permissions

### Debug Mode
```bash
# Run with debug logging
npm run dev -- --debug

# Check log files
# Windows: %USERPROFILE%\.engivault\logs\
# macOS/Linux: ~/.engivault/logs/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add comprehensive error handling
- Include progress callbacks for long operations
- Test cross-platform compatibility
- Document new features

## License

MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- 📖 **Documentation**: [docs.engivault.com](https://docs.engivault.com)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Luqman-Ismat/engivault-api/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Luqman-Ismat/engivault-api/discussions)
- 📧 **Email**: support@engivault.com

---

**EngiVault Launcher** - Making engineering calculations accessible to everyone! 🚀
