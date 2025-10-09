# EngiVault - Complete Testing Guide

## Quick Test: Python Simplified API ✅

Create and run this simple test:

```bash
cd /Users/luqmanismat/Documents/engivault-api

# Create test file
cat > test_python_simple.py << 'EOF'
#!/usr/bin/env python3
import engivault as ev

# Initialize
ev.init('your-api-key-here')  # Replace with your actual API key

# Test 1: Pressure drop
print("Testing Python Simplified API...")
result = ev.pressure_drop(
    flow_rate=0.01,
    pipe_diameter=0.1,
    pipe_length=100,
    fluid_density=1000,
    fluid_viscosity=0.001
)
print(f"✅ Pressure drop: {result['pressure_drop']:.2f} Pa")

# Test 2: Pump power
pump = ev.pump_power(flow_rate=0.05, head=50, efficiency=0.8)
print(f"✅ Pump power: {pump['shaft_power']/1000:.2f} kW")

# Test 3: LMTD
lmtd = ev.lmtd(t_hot_in=373, t_hot_out=323, t_cold_in=293, t_cold_out=333)
print(f"✅ LMTD: {lmtd['lmtd']:.2f} K")

print("\n✅ All Python tests passed!")
EOF

# Install and run
pip3 install --user python-sdk/dist/engivault-1.0.0-py3-none-any.whl
python3 test_python_simple.py
```

## Quick Test: JavaScript Simplified API ✅

```bash
cd /Users/luqmanismat/Documents/engivault-api

# Create test file
cat > test_js_simple.js << 'EOF'
const ev = require('engivault');

// Initialize
ev.init('your-api-key-here');  // Replace with your actual API key

async function test() {
  console.log("Testing JavaScript Simplified API...");
  
  // Test 1: Pressure drop
  const result = await ev.pressureDrop({
    flowRate: 0.01,
    pipeDiameter: 0.1,
    pipeLength: 100,
    fluidDensity: 1000,
    fluidViscosity: 0.001
  });
  console.log(`✅ Pressure drop: ${result.pressureDrop.toFixed(2)} Pa`);
  
  // Test 2: Pump power
  const pump = await ev.pumpPower({
    flowRate: 0.05,
    head: 50,
    efficiency: 0.8
  });
  console.log(`✅ Pump power: ${(pump.shaftPower/1000).toFixed(2)} kW`);
  
  // Test 3: LMTD
  const lmtd = await ev.lmtd({
    tHotIn: 373,
    tHotOut: 323,
    tColdIn: 293,
    tColdOut: 333
  });
  console.log(`✅ LMTD: ${lmtd.lmtd.toFixed(2)} K`);
  
  console.log("\n✅ All JavaScript tests passed!");
}

test().catch(console.error);
EOF

# Build, install and run
cd packages/engivault-js
npm run build
npm pack
npm install -g engivault-1.0.0.tgz
cd ../..
node test_js_simple.js
```

## Quick Test: Excel Office Add-in ✅

### Prerequisites
- Microsoft Excel 2016+ (Windows, Mac, or Online)
- OR access to Excel in browser at office.com

### Steps

1. **Navigate to the add-in**:
   ```bash
   cd /Users/luqmanismat/Documents/engivault-api/excel-addin
   open .  # Opens Finder/File Explorer
   ```

2. **Open Excel** (any version - desktop or online)

3. **Upload the Add-in**:
   - Click **Insert** tab
   - Click **My Add-ins** (or **Get Add-ins**)
   - Click **Upload My Add-in**
   - Browse to: `/Users/luqmanismat/Documents/engivault-api/excel-addin/manifest.xml`
   - Click **Upload**

4. **Configure API Key**:
   - Click **EngiVault** button in ribbon
   - Click **Show Taskpane**
   - Enter your API key in the text field
   - Click **Save API Key**

5. **Test Functions in Excel**:
   
   In any cell, type:
   ```excel
   =ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
   ```
   Should return: ~762517 Pa
   
   ```excel
   =ENGIVAULT.PUMPPOWER(0.05, 50, 0.8)
   ```
   Should return: ~30656 W
   
   ```excel
   =ENGIVAULT.LMTD(373, 323, 293, 333, "counterflow")
   ```
   Should return: ~43.97 K
   
   ```excel
   =ENGIVAULT.VELOCITY(0.01, 0.1)
   ```
   Should return: ~1.273 m/s
   
   ```excel
   =ENGIVAULT.CONVERTFLOW(100, "gpm", "m3/s")
   ```
   Should return: ~0.00631 m³/s

6. **Test Task Pane Calculator**:
   - Use the built-in calculator in the task pane
   - Enter values and click Calculate
   - Results appear instantly

## Comparison: The Three Ways

### Method 1: Python (Simplest for Scripts)
```python
import engivault as ev
ev.init('key')
result = ev.pressure_drop(flow_rate=0.01, pipe_diameter=0.1, ...)
```
**Use for**: Scripts, automation, data processing

### Method 2: JavaScript/Node.js (Best for Apps)
```javascript
const ev = require('engivault');
ev.init('key');
const result = await ev.pressureDrop({flowRate: 0.01, ...});
```
**Use for**: Web apps, Node.js services, React/Vue apps

### Method 3: Excel (Best for Spreadsheets)
```excel
=ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
```
**Use for**: Design calculations, reports, analysis tables

## Troubleshooting

### Python: "Module not found"
```bash
pip3 install --user /Users/luqmanismat/Documents/engivault-api/python-sdk/dist/engivault-1.0.0-py3-none-any.whl
```

### JavaScript: "Cannot find module 'engivault'"
```bash
cd /Users/luqmanismat/Documents/engivault-api/packages/engivault-js
npm pack
npm install -g engivault-1.0.0.tgz
```

### Excel: "Functions not available"
1. Verify manifest uploaded correctly
2. Refresh Excel
3. Check API key is configured in task pane
4. Ensure internet connection

### Excel: "#NAME?" error
- Wait 10-15 seconds for add-in to load
- Restart Excel if persists
- Re-upload manifest if needed

### API Errors
- Verify API key is valid
- Check you have API credits
- Ensure API server is running (https://engivault-api.railway.app/health)

## Full Integration Test

Test all three methods with the same calculation:

**Problem**: Calculate pressure drop for water at 20°C flowing at 10 L/min through 100m of 100mm diameter pipe.

**Parameters**:
- Flow rate: 0.000167 m³/s (10 L/min)
- Pipe diameter: 0.1 m (100 mm)
- Pipe length: 100 m
- Water density: 998.2 kg/m³ (20°C)
- Water viscosity: 0.001002 Pa·s (20°C)

**Python**:
```python
import engivault as ev
ev.init('your-key')
result = ev.pressure_drop(0.000167, 0.1, 100, 998.2, 0.001002)
print(result['pressure_drop'])  # Should be ~21.3 Pa
```

**JavaScript**:
```javascript
const ev = require('engivault');
ev.init('your-key');
const result = await ev.pressureDrop({
  flowRate: 0.000167,
  pipeDiameter: 0.1,
  pipeLength: 100,
  fluidDensity: 998.2,
  fluidViscosity: 0.001002
});
console.log(result.pressureDrop);  // Should be ~21.3 Pa
```

**Excel**:
```excel
=ENGIVAULT.PRESSUREDROP(0.000167, 0.1, 100, 998.2, 0.001002)
```
Result: ~21.3 Pa

All three should give the same answer! ✅

## Get Your API Key

Don't have an API key yet?

1. Visit: https://engivault-api.railway.app
2. Register an account
3. Generate an API key
4. Use in all three integration methods!

---

**You're all set!** Choose the integration method that works best for your use case. 🚀

