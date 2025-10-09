# EngiVault Office Add-in for Excel

Modern, cross-platform Excel add-in for professional engineering calculations. Unlike VBA macros, this is a proper plugin that works on:

- ✅ Excel for Windows
- ✅ Excel for Mac
- ✅ Excel Online (browser)
- ✅ Excel for iPad

## Quick Start

### Installation

1. **Download the manifest file**
   ```bash
   Download manifest.xml from this directory
   ```

2. **Sideload the add-in**
   
   **Windows/Mac:**
   - Open Excel
   - Go to Insert → My Add-ins → Upload My Add-in
   - Select `manifest.xml`
   
   **Excel Online:**
   - Open Excel in browser
   - Insert → Office Add-ins → Upload My Add-in
   - Select `manifest.xml`

3. **Configure API Key**
   - Click "EngiVault" in the ribbon
   - Click "Show Taskpane"
   - Enter your API key
   - Click "Save API Key"

### Using Functions

Once installed, use EngiVault functions directly in Excel formulas:

```excel
# Pressure Drop
=ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
Returns: 762517 Pa

# Pump Power
=ENGIVAULT.PUMPPOWER(0.05, 50, 0.8)
Returns: 30625 W (30.6 kW)

# LMTD
=ENGIVAULT.LMTD(373, 323, 293, 333, "counterflow")
Returns: 43.97 K

# Velocity
=ENGIVAULT.VELOCITY(0.01, 0.1)
Returns: 1.273 m/s

# Reynolds Number
=ENGIVAULT.REYNOLDS(0.01, 0.1, 1000, 0.001)
Returns: 127324

# Water Properties
=ENGIVAULT.WATERDENSITY(20)
Returns: 998.2 kg/m³

=ENGIVAULT.WATERVISCOSITY(20)
Returns: 0.001002 Pa·s

# Unit Conversions
=ENGIVAULT.CONVERTFLOW(100, "gpm", "m3/s")
Returns: 0.00631 m³/s

=ENGIVAULT.CONVERTPRESSURE(100, "psi", "Pa")
Returns: 689476 Pa
```

## Development

### Prerequisites
- Node.js 14+
- Excel (any platform)

### Setup
```bash
# Install dependencies
npm install

# Generate self-signed certificates for HTTPS
npx office-addin-dev-certs install

# Start development server
npm run dev
```

### Building
```bash
# Build for production
npm run build

# Validate manifest
npm run validate
```

### Testing
```bash
# Start the add-in in Excel
npm start

# Stop the add-in
npm stop
```

## Available Functions

### Hydraulics
- `ENGIVAULT.PRESSUREDROP(flowRate, diameter, length, density, viscosity, [roughness])`
- `ENGIVAULT.VELOCITY(flowRate, diameter)`
- `ENGIVAULT.REYNOLDS(flowRate, diameter, density, viscosity)`

### Pumps
- `ENGIVAULT.PUMPPOWER(flowRate, head, efficiency, [density])`
- `ENGIVAULT.NPSHA(suctionPressure, vaporPressure, density, elevationHead, [velocityHead])`

### Heat Transfer
- `ENGIVAULT.LMTD(hotIn, hotOut, coldIn, coldOut, [arrangement])`
- `ENGIVAULT.HXAREA(heatDuty, overallU, hotIn, hotOut, coldIn, coldOut)`

### Utilities
- `ENGIVAULT.WATERDENSITY(temperature)`
- `ENGIVAULT.WATERVISCOSITY(temperature)`
- `ENGIVAULT.CONVERTFLOW(value, fromUnit, toUnit)`
- `ENGIVAULT.CONVERTPRESSURE(value, fromUnit, toUnit)`

## Features

### Modern & Secure
- No VBA import required
- Sandboxed execution
- Cross-platform compatibility
- Automatic updates

### User-Friendly
- Integrated task pane for configuration
- Quick calculator for instant results
- Function browser with descriptions
- Inline help and examples

### Professional
- Real-time API calculations
- Comprehensive error messages
- Production-ready code
- Full TypeScript support

## Advantages over VBA Integration

| Feature | Office Add-in | VBA Macros |
|---------|--------------|------------|
| Cross-platform | ✅ All platforms | ❌ Windows/Mac only |
| Installation | ✅ One-click | ❌ Manual import |
| Updates | ✅ Automatic | ❌ Manual |
| Security | ✅ Sandboxed | ⚠️ Full access |
| Excel Online | ✅ Works | ❌ Not supported |
| Modern UI | ✅ Task pane | ❌ Forms only |

## Troubleshooting

### Add-in not appearing
1. Ensure manifest.xml is properly uploaded
2. Refresh Excel
3. Check Insert → My Add-ins

### Functions not working
1. Verify API key is configured in task pane
2. Check internet connection
3. Ensure you have API credits

### HTTPS certificate issues (development)
```bash
npx office-addin-dev-certs install
```

## Support

- 📖 Documentation: https://engivault.com/excel-addin
- 🐛 Issues: https://github.com/Luqman-Ismat/engivault-api/issues
- 💬 Community: https://github.com/Luqman-Ismat/engivault-api/discussions

## License

MIT License - see LICENSE file for details

---

**EngiVault Office Add-in** - Modern engineering calculations in Excel!

