# EngiVault Architecture - Updated

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EngiVault Platform                            │
│                   Engineering Calculations                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │     EngiVault API Server (Fastify)      │
        │   https://engivault-api.railway.app     │
        │                                          │
        │  ✅ Hydraulics    ✅ Pumps               │
        │  ✅ Heat Transfer ✅ Fluid Mechanics     │
        │  ✅ Authentication ✅ Rate Limiting      │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Python SDK   │    │JavaScript SDK│    │ Excel Add-in │
│              │    │              │    │              │
│ 🆕 Simple API│    │ 🆕 Simple API│    │ 🆕 Plugin!   │
│ ev.init()    │    │ ev.init()    │    │ Install once │
│ ev.func()    │    │ ev.func()    │    │ =ENGIVAULT.* │
│              │    │              │    │              │
│ ✅ v1.0.0    │    │ ✅ v1.0.0    │    │ ✅ v1.0.0    │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Client Integration Options

### Option 1: Python SDK

```python
# New Simplified API ⭐
import engivault as ev
ev.init('key')
result = ev.pressure_drop(...)

# Traditional API (still works)
from engivault import EngiVaultClient
client = EngiVaultClient('key')
result = client.hydraulics.pressure_drop(...)
```

**Use Cases**:
- Data processing scripts
- Automation workflows
- Jupyter notebooks
- Django/Flask applications
- Command-line tools

### Option 2: JavaScript SDK

```javascript
// New Simplified API ⭐
const ev = require('engivault');
ev.init('key');
const result = await ev.pressureDrop({...});

// Traditional API (still works)
const { EngiVault } = require('engivault');
const client = new EngiVault({ apiKey: 'key' });
const result = await client.fluidMechanics.method({...});
```

**Use Cases**:
- Node.js services
- React/Vue/Angular applications
- Express/Fastify servers
- Serverless functions
- Browser applications

### Option 3: Excel Office Add-in

```excel
Installation: Upload manifest.xml once
Usage: =ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
```

**Supported Platforms**:
- ✅ Excel 2016+ (Windows)
- ✅ Excel 2016+ (Mac)
- ✅ Excel Online (browser)
- ✅ Excel for iPad
- ❌ Excel 2013 or older (use VBA instead)

**Use Cases**:
- Engineering spreadsheets
- Design calculations
- Reports and analysis
- Quick calculations
- Sharing with non-programmers

## Components Architecture

### Excel Integration - Two Options

```
┌────────────────────────────────────────────────────────┐
│                Excel Integration                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Option 1: Office Add-in (Recommended) 🆕              │
│  ┌──────────────────────────────────────┐              │
│  │ excel-addin/                          │              │
│  │ ├── manifest.xml      ← Upload this! │              │
│  │ ├── Custom Functions (11 functions)  │              │
│  │ └── Task Pane UI                     │              │
│  │                                       │              │
│  │ ✅ Cross-platform (Win/Mac/Web/iPad) │              │
│  │ ✅ One-click install                 │              │
│  │ ✅ Modern & secure                    │              │
│  └──────────────────────────────────────┘              │
│                                                         │
│  Option 2: VBA Macros (Legacy) 📦                       │
│  ┌──────────────────────────────────────┐              │
│  │ excel-integration/                    │              │
│  │ └── vba-modules/ (9 .bas files)      │              │
│  │                                       │              │
│  │ ✅ Works on desktop Excel             │              │
│  │ ❌ Manual import required             │              │
│  │ ❌ Doesn't work on Excel Online       │              │
│  └──────────────────────────────────────┘              │
└────────────────────────────────────────────────────────┘
```

### SDK Architecture

```
┌────────────────────────────────────────────────────────┐
│                Python SDK Architecture                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  New Simplified Layer 🆕                               │
│  ┌──────────────────────────────────────┐              │
│  │ shortcuts.py                          │              │
│  │ ├── init()                            │              │
│  │ ├── pressure_drop()                   │              │
│  │ ├── pump_power()                      │              │
│  │ ├── lmtd()                            │              │
│  │ └── ... (all functions)               │              │
│  └──────────────────────────────────────┘              │
│                ↓                                        │
│  Traditional Layer (unchanged)                          │
│  ┌──────────────────────────────────────┐              │
│  │ client.py                             │              │
│  │ ├── EngiVaultClient                   │              │
│  │ ├── .hydraulics                       │              │
│  │ ├── .pumps                            │              │
│  │ ├── .heat_transfer                    │              │
│  │ └── .fluid_mechanics                  │              │
│  └──────────────────────────────────────┘              │
└────────────────────────────────────────────────────────┘

Same structure for JavaScript SDK!
```

## Launcher Architecture (Updated)

```
┌─────────────────────────────────────────────────────────┐
│          EngiVault Cross-Platform Launcher              │
│               (Electron Application)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Installers:                                            │
│  ├── 🐍 Python SDK Installer                           │
│  ├── 📦 NPM Package Installer                          │
│  ├── 📊 Excel VBA Installer (Legacy)                   │
│  └── 🆕 Office Add-in Installer (NEW!)                 │
│                                                          │
│  Resources (Bundled):                                   │
│  ├── python-sdk/ (with wheel & tarball)                │
│  ├── packages/engivault-js/ (with tarball)             │
│  ├── excel-integration/ (VBA modules)                  │
│  └── 🆕 excel-addin/ (Office Add-in files)             │
│                                                          │
│  Platform Support:                                      │
│  ✅ Windows (x64, x86)                                  │
│  ✅ macOS (Intel & Apple Silicon)                       │
│  ✅ Linux (AppImage, DEB, RPM)                          │
└─────────────────────────────────────────────────────────┘
```

## File Organization

```
engivault-api/
│
├── src/                          # API Server (Fastify/TypeScript)
│   ├── routes/                   # API endpoints
│   ├── logic/                    # Calculation logic
│   └── utils/                    # Utilities
│
├── python-sdk/                   # Python SDK
│   ├── engivault/
│   │   ├── client.py             # Traditional API
│   │   ├── shortcuts.py          # 🆕 Simplified API
│   │   └── ...
│   ├── examples/
│   │   ├── quickstart.py         # 🆕 5-line example
│   │   └── advanced.py           # 🆕 All features
│   └── tests/
│       └── test_shortcuts.py     # 🆕 Tests
│
├── packages/engivault-js/        # JavaScript SDK
│   ├── src/
│   │   ├── index.ts              # Updated with shortcuts
│   │   ├── shortcuts.ts          # 🆕 Simplified API
│   │   └── ...
│   ├── examples/
│   │   ├── quickstart.js         # 🆕 Simple example
│   │   ├── typescript-quickstart.ts # 🆕 TS example
│   │   └── batch.js              # 🆕 Batch processing
│   └── tests/
│       └── shortcuts.test.ts     # 🆕 Tests
│
├── excel-addin/                  # 🆕 Office Add-in (NEW!)
│   ├── manifest.xml              # ⭐ Upload this to Excel
│   ├── package.json
│   ├── webpack.config.js
│   ├── README.md                 # Installation guide
│   └── src/
│       ├── functions/
│       │   ├── functions.ts      # 11 custom functions
│       │   └── functions.json
│       ├── taskpane/
│       │   ├── taskpane.html     # Modern UI
│       │   ├── taskpane.js
│       │   └── taskpane.css
│       └── commands/
│
├── excel-integration/            # VBA Macros (Legacy)
│   └── vba-modules/              # Still available
│
└── launcher/                     # Cross-platform installer
    ├── main.js                   # Updated with Office Add-in
    └── src/
        ├── installers/
        │   └── office-addin-installer.js # 🆕 New installer
        └── utils/
            └── resources.js      # Updated for Office Add-in
```

## Data Flow

### Simplified API Flow

```
User Code (Python/JS)
        │
        ├─ ev.init('key')          # Initialize global client
        │
        └─ ev.pressure_drop(...)   # Direct function call
                │
                ▼
        Global Client Instance
                │
                ▼
        EngiVault API Server
                │
                ▼
        Calculation Logic
                │
                ▼
        JSON Response
                │
                ▼
        Return to User
```

### Excel Office Add-in Flow

```
Excel Cell
        │
        ├─ =ENGIVAULT.PRESSUREDROP(...)  # Formula
        │
        ▼
Office.js Custom Function
        │
        ▼
Fetch API Call (HTTPS)
        │
        ├─ Headers: Authorization Bearer {apiKey}
        ├─ Body: JSON parameters
        │
        ▼
EngiVault API Server
        │
        ▼
Calculation Result
        │
        ▼
Return to Excel Cell
```

## Technology Stack

### API Server
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: JWT tokens
- **Deployment**: Railway

### Python SDK
- **Language**: Python 3.8+
- **HTTP Client**: requests/httpx
- **Validation**: Pydantic
- **Testing**: pytest

### JavaScript SDK
- **Language**: TypeScript
- **HTTP Client**: axios
- **Validation**: Zod
- **Build**: Rollup
- **Testing**: Jest

### Excel Office Add-in
- **Framework**: Office.js
- **Language**: TypeScript
- **Build**: Webpack
- **Dev Server**: webpack-dev-server
- **API**: Office JavaScript API

### Launcher
- **Framework**: Electron
- **UI**: HTML/CSS/JavaScript
- **Build**: electron-builder
- **Platforms**: Windows, macOS, Linux

## Version Information

- **API Server**: v2.0.0
- **Python SDK**: v1.0.0 (with simplified API)
- **JavaScript SDK**: v1.0.0 (with simplified API)
- **Office Add-in**: v1.0.0 (brand new!)
- **VBA Integration**: v1.0.0 (legacy, still supported)
- **Launcher**: v1.0.0

---

**All components work together seamlessly!** 🎉

