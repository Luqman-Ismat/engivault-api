# ENGiVAULT Launcher - Full Installer Implementation

## Overview

The ENGiVAULT Launcher is a complete cross-platform installer built with Electron that packages and installs all ENGiVAULT components including:

- **Excel Integration** - VBA modules, templates, examples, and documentation
- **Python SDK** - Full Python package with all dependencies
- **JavaScript SDK** - NPM package with TypeScript support

## Architecture

### Resource Management System

The installer uses a sophisticated resource management system (`src/utils/resources.js`) that:

1. **Detects Environment**: Automatically determines if running in development or production mode
2. **Locates Resources**: Finds bundled resources in both dev and packaged app contexts
3. **Validates Resources**: Ensures all required files are present before installation
4. **Provides Abstraction**: Single API for accessing Excel, Python, and JavaScript resources

### Installer Modules

#### 1. Excel Installer (`src/installers/excel-installer.js`)

**Features:**
- Detects Microsoft Excel (Windows/Mac) or LibreOffice Calc (Linux)
- Copies all 9 VBA modules from bundled resources
- Installs templates and example workbooks
- Copies complete documentation
- Creates installation instructions for manual VBA import
- Platform-specific add-in registration (Windows/Mac/Linux)
- Desktop shortcuts for easy access

**Resources Installed:**
- `EngiVaultAPI.bas` - Core API module
- `EngiVaultAPI_Enhanced.bas` - Enhanced features
- `EngiVaultFluidMechanics.bas` - Fluid mechanics functions
- `EngiVaultHeatTransfer.bas` - Heat transfer calculations
- `EngiVaultHelpers.bas` - Utility functions
- `EngiVaultCharts.bas` - Charting capabilities
- `EngiVaultAutomation.bas` - Automation features
- `EngiVault_Installer.bas` - Auto-installer
- `EngiVaultEquipmentSizing.bas` - Equipment sizing

**Templates:**
- Pipe Sizing Template
- Pump Analysis Template
- Heat Transfer Template

**Documentation:**
- Function Reference
- Installation Guide
- Fluid Mechanics Guide
- Heat Transfer Guide
- Formula Tab Integration

#### 2. Python Installer (`src/installers/python-installer.js`)

**Features:**
- Detects Python 3.8+ installation
- Creates isolated virtual environment (optional)
- Installs from bundled wheel/tarball if available
- Falls back to PyPI installation
- Configures CLI tools
- Creates desktop shortcuts
- Platform-specific shortcuts (Windows .bat, Unix .sh)

**Installation Methods:**
1. **Bundled Package** - Installs from included wheel or tarball
2. **Source Installation** - Installs from bundled source directory
3. **PyPI Fallback** - Downloads from Python Package Index

**Virtual Environment Support:**
- Optional isolated Python environment
- Automatic activation scripts
- Prevents conflicts with system packages

#### 3. NPM Installer (`src/installers/npm-installer.js`)

**Features:**
- Detects Node.js 14+ and package manager (npm/yarn/pnpm)
- Supports global or local installation
- Installs from bundled tarball if available
- Falls back to npm registry
- Creates project structure for local installs
- Includes TypeScript definitions
- Generates example files

**Installation Methods:**
1. **Bundled Tarball** - Installs from included .tgz file
2. **NPM Registry Fallback** - Downloads from npmjs.com

**Example Files Created:**
- `basic-example.js` - JavaScript usage examples
- `typescript-example.ts` - TypeScript with full type safety
- `README.md` - Usage instructions

#### 4. System Checker (`src/installers/system-checker.js`)

**Comprehensive Checks:**
- Node.js version (>= 14.0.0)
- NPM version (>= 6.0.0)
- Python version (>= 3.8.0)
- pip version (>= 20.0.0)
- Git installation (optional)
- Disk space availability
- Internet connectivity
- File system permissions
- Platform-specific requirements

**Platform-Specific Checks:**

**Windows:**
- Windows 10+ detection
- PowerShell 5+ availability
- Excel registry detection

**macOS:**
- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools
- Excel in Applications folder

**Linux:**
- Distribution detection
- Build tools (GCC) availability
- LibreOffice Calc detection

## Build System

### Pre-Build Script (`scripts/prepare-build.js`)

Automatically prepares all resources before building:

1. **Python SDK**
   - Cleans old builds
   - Builds wheel and source distribution
   - Validates output files

2. **JavaScript SDK**
   - Installs dependencies if needed
   - Builds TypeScript sources
   - Creates npm tarball
   - Validates package

3. **Excel Resources**
   - Validates VBA modules (9 .bas files)
   - Checks templates availability
   - Verifies examples and documentation

4. **Final Validation**
   - Ensures all required resources present
   - Reports any missing files
   - Fails build if resources incomplete

### Electron Builder Configuration

**Resource Bundling:**
```json
{
  "extraResources": [
    {
      "from": "../excel-integration",
      "to": "app/excel-integration"
    },
    {
      "from": "../python-sdk",
      "to": "app/python-sdk"
    },
    {
      "from": "../packages/engivault-js",
      "to": "app/packages/engivault-js"
    }
  ]
}
```

**Platform Targets:**
- **Windows**: NSIS installer + Portable executable (x64, ia32)
- **macOS**: DMG + ZIP (x64, arm64)
- **Linux**: AppImage + DEB + RPM (x64)

## Usage

### Development

```bash
# Install dependencies
cd launcher
npm install

# Run in development mode
npm run dev

# The app will load resources from parent directory
```

### Building

```bash
# Prepare all resources and build for current platform
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build for all platforms
npm run build:all
```

### Distribution Files

After building, you'll find in `launcher/dist/`:

**Windows:**
- `ENGiVAULT Installer Setup X.X.X.exe` - NSIS installer
- `ENGiVAULT Installer X.X.X.exe` - Portable version

**macOS:**
- `ENGiVAULT Installer-X.X.X.dmg` - Disk image
- `ENGiVAULT Installer-X.X.X-mac.zip` - ZIP archive
- Universal binary supporting Intel and Apple Silicon

**Linux:**
- `ENGiVAULT Installer-X.X.X.AppImage` - Universal binary
- `engivault-launcher_X.X.X_amd64.deb` - Debian package
- `engivault-launcher-X.X.X.x86_64.rpm` - RPM package

## Installation Flow

### User Experience

1. **Launch Installer**
   - Beautiful modern UI
   - System requirements check
   - Resource validation

2. **Select Components**
   - Excel Integration (VBA modules)
   - Python SDK (with virtual environment option)
   - JavaScript SDK (global or local)

3. **Installation**
   - Real-time progress tracking
   - Component-specific progress updates
   - Detailed logging

4. **Completion**
   - Installation summary
   - Quick start instructions
   - Desktop shortcuts created
   - Documentation links

### Technical Flow

```
User launches installer
    ↓
System check performed
    ↓
Resources validated
    ↓
User selects components
    ↓
┌─────────────┬──────────────┬────────────┐
│   Excel     │   Python     │   Node.js  │
│             │              │            │
│ Detect app  │ Check Python │ Check Node │
│ Copy VBA    │ Create venv  │ Init project│
│ Install     │ Install pkg  │ Install pkg │
│ Register    │ Setup CLI    │ Create ex. │
│ Create docs │ Shortcuts    │ Shortcuts  │
└─────────────┴──────────────┴────────────┘
    ↓
Installation complete
    ↓
User ready to use ENGiVAULT!
```

## Resource Locations

### Development Mode
```
engivault-api/
├── excel-integration/     ← Direct access
├── python-sdk/           ← Direct access
├── packages/
│   └── engivault-js/     ← Direct access
└── launcher/
    └── main.js
```

### Production Mode (Packaged)
```
Application.app/
└── Contents/
    └── Resources/
        └── app/
            ├── excel-integration/    ← Bundled resources
            ├── python-sdk/           ← Bundled resources
            └── packages/
                └── engivault-js/     ← Bundled resources
```

## Installation Paths

### Default Locations

**Windows:**
```
%USERPROFILE%\AppData\Local\ENGiVAULT\
├── excel-integration\
├── python\
└── js\
```

**macOS/Linux:**
```
~/.engivault/
├── excel-integration/
├── python/
└── js/
```

### Excel Integration Contents
```
.engivault/excel-integration/
├── modules/
│   ├── EngiVaultAPI.bas
│   ├── EngiVaultAPI_Enhanced.bas
│   └── ... (7 more modules)
├── templates/
│   ├── Pipe_Sizing_Template.md
│   ├── Pump_Analysis_Template.md
│   └── Heat_Transfer_Template.md
├── examples/
│   ├── Simple_Examples.md
│   └── Heat_Transfer_Examples.md
├── documentation/
│   ├── Function_Reference.md
│   ├── Installation_Guide.md
│   └── ... (3 more docs)
├── addin/
│   └── INSTALLATION_INSTRUCTIONS.md
└── README.md
```

### Python SDK Contents
```
.engivault/python/
├── bin/
│   ├── python
│   ├── pip
│   └── engivault
├── lib/
│   └── python3.x/
│       └── site-packages/
│           └── engivault/
└── scripts/
```

### JavaScript SDK Contents
```
.engivault/js/
├── node_modules/
│   └── engivault/
├── examples/
│   ├── basic-example.js
│   ├── typescript-example.ts
│   └── README.md
└── package.json
```

## Advanced Features

### Logging System

All installation activities are logged:
```
~/.engivault/logs/installer.log
```

**Log Levels:**
- `ERROR` - Critical issues
- `WARN` - Non-critical issues
- `INFO` - Installation progress
- `DEBUG` - Detailed technical info

### Error Handling

**Graceful Degradation:**
- If templates missing → Create placeholder templates
- If examples missing → Create basic examples
- If registry unavailable → Provide manual instructions
- If bundled package missing → Fall back to online installation

**User Feedback:**
- Clear error messages
- Actionable suggestions
- Troubleshooting guidance
- Log file references

### Uninstallation

Each component can be uninstalled independently:

```javascript
// Excel
excelInstaller.uninstall(installDir)

// Python
pythonInstaller.uninstall(venvPath)

// JavaScript
npmInstaller.uninstall(global, projectPath)
```

**Cleanup:**
- Removes installed files
- Removes shortcuts
- Preserves user data/configurations
- Logs uninstallation

## API Reference

### IPC Handlers

```javascript
// System Information
ipcRenderer.invoke('get-system-info')
ipcRenderer.invoke('check-requirements')
ipcRenderer.invoke('get-resources-info')
ipcRenderer.invoke('validate-resources')

// Installation
ipcRenderer.invoke('install-python', options)
ipcRenderer.invoke('install-npm', options)
ipcRenderer.invoke('install-excel', options)

// Utilities
ipcRenderer.invoke('open-external', url)
ipcRenderer.invoke('show-open-dialog', options)
ipcRenderer.invoke('get-install-path')
ipcRenderer.invoke('set-install-path', newPath)
```

### Progress Callbacks

All installers support progress callbacks:

```javascript
const progressCallback = (progress) => {
  console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
};

await installer.install(options, progressCallback);
```

**Progress Stages:**
- `preparing` - Initial setup
- `verifying` - Checking prerequisites
- `creating-directory` - Setting up paths
- `copying-modules` - Copying files
- `installing-package` - Installing dependencies
- `complete` - Installation finished
- `error` - Something went wrong

## Testing

### Manual Testing

1. **Development Mode:**
   ```bash
   npm run dev
   ```
   - Resources loaded from parent directory
   - Fast iteration
   - Full logging

2. **Production Build:**
   ```bash
   npm run build
   npm run pack  # Creates unpacked app in dist/
   ```
   - Test with bundled resources
   - Verify all files copied correctly

3. **Distribution Testing:**
   - Install on clean VM/machine
   - Verify all components install
   - Test uninstallation

### Automated Validation

```bash
# Validate resources before building
npm run prepare-build
```

## Troubleshooting

### Common Issues

**"VBA modules not found"**
- Ensure `excel-integration/vba-modules/` exists
- Run `npm run prepare-build`
- Check `.gitignore` not excluding files

**"Python package not found"**
- Build Python package: `cd python-sdk && python3 -m build`
- Check `python-sdk/dist/` for wheel/tarball

**"JavaScript tarball missing"**
- Build JS package: `cd packages/engivault-js && npm pack`
- Verify `engivault-*.tgz` file exists

**Resource validation fails**
- Run preparation script: `npm run prepare-build`
- Check console output for specific issues
- Verify parent directory structure

## Future Enhancements

### Planned Features

1. **Auto-Updates**: Electron auto-updater integration
2. **Cloud Sync**: Sync preferences across installations
3. **Custom Components**: Plugin system for extensions
4. **Offline Mode**: Complete offline installation
5. **Advanced Config**: Custom installation paths, selective components
6. **Wizard UI**: Step-by-step guided installation
7. **Diagnostics**: Built-in troubleshooting tools

### Contribution Guidelines

When adding new resources:

1. Add to appropriate directory (`excel-integration/`, `python-sdk/`, etc.)
2. Update `scripts/prepare-build.js` validation
3. Test in both development and production modes
4. Update documentation

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@engivault.com

---

**Built with ❤️ by the ENGiVAULT Team**


