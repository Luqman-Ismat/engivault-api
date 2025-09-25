# EngiVault Beta Testing Program

## 🧪 Welcome Beta Tester!

Thank you for participating in the EngiVault Beta Testing Program! You're helping us build the best engineering calculations platform.

## 🎯 What We're Testing

### **Core Components**
- ✅ **TypeScript API** - REST API with comprehensive engineering calculations
- ✅ **Python SDK** - Complete Python library with CLI tools
- ✅ **JavaScript SDK** - NPM package with full TypeScript support
- ✅ **Excel Integration** - VBA modules for Excel/LibreOffice
- ✅ **Cross-Platform Launcher** - One-click installer for all components

### **Key Features**
- **Fluid Mechanics**: Open channel flow, compressible flow, boundary layer analysis
- **Heat Transfer**: Heat exchangers, LMTD, convection, fin analysis
- **Hydraulics**: Pressure drop, flow rate calculations
- **Pumps**: Performance analysis, NPSH calculations

## 🚀 Getting Started

### **Option 1: Cross-Platform Launcher (Recommended)**
1. Download the launcher for your platform:
   - **Windows**: `EngiVault-Installer-1.0.0.exe`
   - **macOS**: `EngiVault-Installer-1.0.0.dmg`
   - **Linux**: `EngiVault-Installer-1.0.0.AppImage`

2. Run the installer and follow the guided setup
3. Choose which components to install (Python, NPM, Excel)
4. Start using EngiVault!

### **Option 2: Manual Installation**

#### **Python SDK**
```bash
cd python-sdk
pip install -e .[dev,docs,cli]

# Test installation
engivault --version
python -c "import engivault; print('Success!')"
```

#### **JavaScript SDK**
```bash
cd packages/engivault-js
npm install
npm run build

# Test installation
npm pack
npm install -g ./engivault-1.0.0.tgz

# Test in Node.js
node -e "const {EngiVault} = require('engivault'); console.log('Success!');"
```

#### **Excel Integration**
1. Open Excel/LibreOffice Calc
2. Import VBA modules from `excel-integration/vba-modules/`
3. Run the installer macro: `EngiVault_Installer.bas`
4. Test with example templates in `excel-integration/templates/`

## 📝 What We Need From You

### **Critical Testing Areas**
1. **Installation Process**
   - Does the launcher work on your platform?
   - Are all components installed correctly?
   - Any error messages during installation?

2. **Calculation Accuracy**
   - Test calculations against known results
   - Compare with other engineering software
   - Verify units and conversions

3. **API Usability**
   - Is the API intuitive to use?
   - Are error messages helpful?
   - Is the documentation clear?

4. **Performance**
   - Response times for calculations
   - Memory usage during operations
   - Startup time for applications

5. **Integration Quality**
   - Python SDK ease of use
   - NPM package TypeScript support
   - Excel VBA function reliability

### **Testing Scenarios**

#### **Fluid Mechanics Testing**
```python
# Python example
from engivault import EngiVault

client = EngiVault(api_key="beta-test-key")

# Test open channel flow
result = client.fluid_mechanics.open_channel_flow(
    flow_rate=10.0,
    channel_width=5.0,
    channel_slope=0.001,
    mannings_coeff=0.03
)

print(f"Normal depth: {result.normal_depth:.3f} m")
# Expected: ~1.5-2.0 m (verify with manual calculation)
```

```javascript
// JavaScript example
const { EngiVault } = require('engivault');

const client = new EngiVault({ apiKey: 'beta-test-key' });

const result = await client.fluidMechanics.compressibleFlow({
  machNumber: 2.0,
  temperature: 288,
  pressure: 101325,
  gasProperties: { gamma: 1.4, gasConstant: 287, molecularWeight: 28.97 }
});

console.log(`Velocity: ${result.velocity} m/s`);
// Expected: ~680 m/s (verify with isentropic relations)
```

#### **Heat Transfer Testing**
```python
# LMTD calculation test
result = client.heat_transfer.lmtd(
    t_hot_in=373,    # 100°C
    t_hot_out=323,   # 50°C
    t_cold_in=293,   # 20°C
    t_cold_out=333,  # 60°C
    flow_arrangement='counterflow'
)

print(f"LMTD: {result.lmtd:.2f} K")
# Expected: ~42.5 K (verify with manual calculation)
```

#### **Excel Integration Testing**
```vba
' Excel VBA test
=ENGIVAULT_LMTD(373, 323, 293, 333, "counterflow")
' Expected result: ~42.5
```

### **Edge Cases to Test**
- Very small/large input values
- Boundary conditions (zero flow, infinite values)
- Invalid input combinations
- Network connectivity issues
- Permission problems during installation

## 🐛 Reporting Issues

### **How to Report**
1. **GitHub Issues**: [Create New Issue](https://github.com/Luqman-Ismat/engivault-api/issues/new)
2. **Email**: beta@engivault.com
3. **Discord**: [EngiVault Beta Channel](https://discord.gg/engivault-beta)

### **Issue Template**
```markdown
**Component**: Python SDK / JavaScript SDK / Excel Integration / Launcher

**Platform**: Windows 10/11, macOS Monterey+, Ubuntu 20.04+

**Expected Behavior**: 
What should happen?

**Actual Behavior**: 
What actually happened?

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Error Messages**:
```
Paste any error messages here
```

**System Information**:
- OS: 
- Node.js version: 
- Python version: 
- Excel version: 

**Additional Context**:
Any other relevant information
```

### **Priority Levels**
- 🔴 **Critical**: Crashes, data corruption, security issues
- 🟡 **High**: Major functionality broken, blocking workflows
- 🟢 **Medium**: Minor bugs, usability issues
- 🔵 **Low**: Enhancement requests, documentation issues

## ✅ Testing Checklist

### **Installation Testing**
- [ ] Launcher downloads and runs on your platform
- [ ] System requirements check works correctly
- [ ] All selected components install successfully
- [ ] Installation completes without errors
- [ ] Shortcuts and documentation are created

### **Python SDK Testing**
- [ ] Package imports correctly: `import engivault`
- [ ] Client initialization works: `EngiVault(api_key="test")`
- [ ] CLI tool works: `engivault --version`
- [ ] Calculations return expected results
- [ ] Error handling is appropriate

### **JavaScript SDK Testing**
- [ ] Package imports correctly: `const {EngiVault} = require('engivault')`
- [ ] TypeScript definitions work in IDE
- [ ] Calculations return expected results
- [ ] Browser compatibility (if applicable)
- [ ] Error handling is appropriate

### **Excel Integration Testing**
- [ ] VBA modules import successfully
- [ ] Functions are available in Excel
- [ ] Calculations return correct results
- [ ] Templates work as expected
- [ ] Error handling in Excel is user-friendly

### **Cross-Platform Testing**
- [ ] Launcher works on your specific OS version
- [ ] All features work as expected on your platform
- [ ] No platform-specific bugs or crashes
- [ ] Installation paths are appropriate for your OS

## 📊 Beta Testing Timeline

### **Phase 1: Core Functionality (Weeks 1-2)**
- Focus: Basic installation and core calculations
- Target: 5-10 trusted engineers
- Goal: Validate fundamental functionality

### **Phase 2: Extended Testing (Weeks 3-4)**
- Focus: Real-world use cases and edge cases
- Target: 15-20 engineers across disciplines
- Goal: Identify usability issues and missing features

### **Phase 3: Pre-Launch (Week 5)**
- Focus: Final bug fixes and polish
- Target: All beta testers
- Goal: Prepare for public launch

## 🎁 Beta Tester Benefits

### **Exclusive Access**
- ✅ Early access to all new features
- ✅ Direct line to development team
- ✅ Influence on product roadmap
- ✅ Free Pro subscription for 1 year (when launched)

### **Recognition**
- ✅ Listed as beta tester in credits
- ✅ Special badge in community forums
- ✅ Priority support
- ✅ Early access to future products

## 📞 Communication Channels

### **Real-Time Support**
- **Discord**: [EngiVault Beta Channel](https://discord.gg/engivault-beta)
- **Weekly Calls**: Fridays 2 PM EST (optional)

### **Asynchronous Support**
- **GitHub Discussions**: For feature requests and general questions
- **Email**: beta@engivault.com for private issues
- **GitHub Issues**: For bug reports

### **Documentation**
- **API Docs**: [engivault-api.railway.app/documentation](https://engivault-api.railway.app/documentation)
- **Python Docs**: `python-sdk/README.md`
- **JavaScript Docs**: `packages/engivault-js/README.md`
- **Excel Docs**: `excel-integration/README.md`

## 🔄 Feedback Process

### **Weekly Check-ins**
- Brief email with current status
- Any blockers or major issues
- Suggestions for improvements

### **Feature Requests**
- Use GitHub Discussions for new feature ideas
- Provide engineering use case context
- Explain priority and impact

### **Bug Reports**
- Use GitHub Issues with provided template
- Include reproduction steps
- Attach relevant log files

## 🏆 Success Metrics

We're tracking these metrics during beta:
- **Installation Success Rate**: >95%
- **Calculation Accuracy**: 100% (compared to manual calculations)
- **User Satisfaction**: >4.5/5 stars
- **Platform Coverage**: Windows, macOS, Linux all working
- **Performance**: <2 second response times for calculations

## 🚀 Next Steps After Beta

1. **Public Launch**: NPM and PyPI publication
2. **Documentation Site**: Complete docs.engivault.com
3. **Community Building**: Public Discord and forums
4. **Enterprise Features**: SSO, on-premises deployment
5. **Additional Integrations**: CAD software, MATLAB, R

---

**Thank you for being part of the EngiVault journey!** 

Your feedback is invaluable in making EngiVault the best engineering calculations platform. Every bug report, suggestion, and use case helps us build something amazing.

Happy testing! 🧪✨

