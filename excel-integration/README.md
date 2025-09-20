# EngiVault Excel Integration

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Luqman-Ismat/engivault-excel-integration)
[![Excel](https://img.shields.io/badge/Excel-2016%2B-green.svg)](https://www.microsoft.com/excel)
[![API](https://img.shields.io/badge/API-EngiVault-orange.svg)](https://engivault-api-production.up.railway.app)

Bring powerful engineering calculations directly to Microsoft Excel with EngiVault's comprehensive VBA integration.

## 🚀 Quick Start

### Simple Pressure Drop Calculation
```excel
=ENGIVAULT_PRESSURE_DROP(0.1, 0.1, 100, 1000, 0.001)
```
**Result**: 762,517 Pa pressure drop

### Pump Power Calculation
```excel
=ENGIVAULT_PUMP_POWER(0.05, 50, 0.8, 5000)
```
**Result**: 0.025 kW hydraulic power

### Unit Conversion
```excel
=CONVERT_FLOW_RATE(100, "gpm", "m3/s")
```
**Result**: 0.006309 m³/s

## 📋 Features

### 🔧 **Hydraulic Calculations**
- **Pressure Drop**: Darcy-Weisbach equation with automatic friction factor calculation
- **Flow Rate**: Inverse pressure drop calculation using iterative methods
- **Reynolds Number**: Pipe flow analysis
- **Velocity**: Fluid velocity in pipes

### ⚙️ **Pump Analysis**
- **Hydraulic Power**: Pump power calculations
- **NPSH Analysis**: Cavitation prevention calculations
- **Efficiency**: Pump performance analysis
- **Operating Point**: System curve intersection

### 🧮 **Utility Functions**
- **Fluid Properties**: Water density, viscosity, vapor pressure at temperature
- **Unit Conversions**: Flow rate, pressure, length between different units
- **Pipe Sizing**: Diameter recommendations and standard size selection
- **Validation**: Flow regime and velocity checks

### 📊 **Advanced Features**
- **Error Handling**: Comprehensive error messages and validation
- **Performance Optimization**: Caching and batch processing
- **Real-time API**: Live calculations from EngiVault servers
- **Template Integration**: Pre-built Excel templates

## 🛠️ Installation

### 1. Download VBA Modules
- [`EngiVaultAPI.bas`](vba-modules/EngiVaultAPI.bas) - Core API functions
- [`EngiVaultHelpers.bas`](vba-modules/EngiVaultHelpers.bas) - Helper functions

### 2. Import to Excel
1. **Open Excel** and press `Alt + F11`
2. **Right-click VBAProject** → Import File
3. **Select and import both .bas files**

### 3. Enable Macros
- **File** → **Options** → **Trust Center** → **Macro Settings**
- **Enable all macros** or **Disable with notification**

### 4. Set Authentication
```vba
Sub Setup()
    Call SetEngiVaultJWTToken("your-jwt-token-here")
End Sub
```

### 5. Test Installation
```excel
=ENGIVAULT_VERSION()    ' Should return: 1.0.0
=ENGIVAULT_API_STATUS() ' Should return: Online
```

## 📚 Function Reference

### Core Functions

| Function | Description | Example |
|----------|-------------|---------|
| `ENGIVAULT_PRESSURE_DROP` | Calculate pressure drop | `=ENGIVAULT_PRESSURE_DROP(0.1,0.1,100,1000,0.001)` |
| `ENGIVAULT_FLOW_RATE` | Calculate flow rate | `=ENGIVAULT_FLOW_RATE(10000,0.1,100,1000,0.001)` |
| `ENGIVAULT_PUMP_POWER` | Calculate pump power | `=ENGIVAULT_PUMP_POWER(0.05,50,0.8,5000)` |
| `ENGIVAULT_NPSH_AVAILABLE` | Calculate NPSH | `=ENGIVAULT_NPSH_AVAILABLE(101325,2337,1000,2,1.5)` |

### Helper Functions

| Function | Description | Example |
|----------|-------------|---------|
| `WATER_DENSITY` | Water density at temperature | `=WATER_DENSITY(20)` |
| `CONVERT_FLOW_RATE` | Convert flow units | `=CONVERT_FLOW_RATE(100,"gpm","m3/s")` |
| `PIPE_SIZE_RECOMMENDATION` | Recommend pipe size | `=PIPE_SIZE_RECOMMENDATION(0.1,3,"mm")` |
| `VALIDATE_VELOCITY` | Check velocity range | `=VALIDATE_VELOCITY(2.5,"water")` |

## 📊 Templates

### Pipe Sizing Template
Comprehensive pipe sizing analysis with:
- Multiple diameter comparison
- Pressure drop analysis
- Velocity validation
- Standard size recommendations

### Pump Selection Template
Complete pump analysis including:
- System curve calculation
- Pump comparison table
- NPSH safety analysis
- Economic evaluation

### System Analysis Template
Full system design with:
- Hydraulic calculations
- Equipment sizing
- Performance optimization
- Cost analysis

## 🎯 Use Cases

### 1. **Water Distribution System**
```excel
' System parameters
Flow Rate:     =CONVERT_FLOW_RATE(500,"gpm","m3/s")  ' 0.0315 m³/s
Pipe Length:   200 m
Elevation:     25 m

' Calculate pressure drop
Friction Loss: =ENGIVAULT_PRESSURE_DROP(B2,0.15,B3,1000,0.001)

' Size pump
Total Head:    =B4+(B5/(1000*9.81))
Pump Power:    =ENGIVAULT_PUMP_POWER(B2,B6,0.8,7500)
```

### 2. **Cooling Water Circuit**
```excel
' Fluid properties at operating temperature
Density:       =WATER_DENSITY(35)      ' 994 kg/m³
Viscosity:     =WATER_VISCOSITY(35)    ' 0.000719 Pa·s
Vapor Press:   =WATER_VAPOR_PRESSURE(35) ' 5627 Pa

' NPSH analysis
NPSH Available: =ENGIVAULT_NPSH_AVAILABLE(101325,B4,B2,2.5,2.0)
Safety Margin:  =B5-4.5  ' Assuming 4.5m NPSH required
```

### 3. **Chemical Process Line**
```excel
' High viscosity fluid
Viscosity:     0.05 Pa·s (50 cP)
Density:       850 kg/m³

' Flow analysis
Reynolds:      =ENGIVAULT_REYNOLDS_NUMBER(0.02,0.08,B3,B2)
Flow Regime:   =VALIDATE_FLOW_REGIME(B4)
Pressure Drop: =ENGIVAULT_PRESSURE_DROP(0.02,0.08,150,B3,B2)
```

## 🔧 Advanced Usage

### Batch Processing
```excel
' Process multiple pipe sizes simultaneously
=ENGIVAULT_PRESSURE_DROP($A2,B$1,100,1000,0.001)
```
*Copy across columns for different diameters, down rows for different flow rates*

### Error Handling
```excel
=IFERROR(ENGIVAULT_PRESSURE_DROP(A1,B1,C1,D1,E1), "Check inputs")
```

### Conditional Calculations
```excel
=IF(ENGIVAULT_REYNOLDS_NUMBER(A1,B1,C1,D1)>4000,
    ENGIVAULT_PRESSURE_DROP(A1,B1,C1,D1,E1),
    "Use laminar flow correlation")
```

### Performance Optimization
```vba
' Disable screen updating for bulk calculations
Application.ScreenUpdating = False
' ... your calculations ...
Application.ScreenUpdating = True
```

## 🛡️ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `#NAME?` | Function not found | Import VBA modules |
| `#VALUE!` | Invalid parameters | Check input values |
| `#N/A` | API connection failed | Check internet/auth |
| `"Offline"` | API unavailable | Verify API status |

### Debug Mode
Enable detailed error logging:
```vba
Public Const DEBUG_MODE As Boolean = True
```

## 🔒 Security & Authentication

### API Key Management
```vba
' Secure storage (recommended)
Sub SecureSetup()
    Dim apiKey As String
    apiKey = InputBox("Enter your EngiVault API Key:", "Authentication")
    Call SetEngiVaultAPIKey(apiKey)
End Sub
```

### Network Security
- All API calls use HTTPS encryption
- No sensitive data stored locally
- API keys can be rotated anytime

## 📈 Performance

### Optimization Tips
1. **Cache Results**: Store calculated values to avoid repeated API calls
2. **Manual Calculation**: Use manual calc mode for large datasets
3. **Batch Operations**: Group similar calculations together
4. **Error Handling**: Use IFERROR to prevent cascade failures

### Rate Limits
- **Free Tier**: 100 requests/month
- **Basic Tier**: 1,000 requests/month
- **Pro Tier**: 10,000 requests/month
- **Enterprise**: 100,000 requests/month

## 🆘 Troubleshooting

### Installation Issues
```vba
' Test VBA environment
Sub TestInstallation()
    Debug.Print "Excel Version: " & Application.Version
    Debug.Print "VBA7: " & CBool(Application.Version >= 14)
    Debug.Print "64-bit: " & Application.VBE.ActiveVBProject.VBComponents.Count > 0
End Sub
```

### Network Issues
```vba
' Test API connectivity
Sub TestConnection()
    Dim result As String
    result = ENGIVAULT_API_STATUS()
    MsgBox "API Status: " & result
End Sub
```

### Performance Issues
- **Reduce API calls**: Cache frequently used values
- **Use manual calculation**: Avoid auto-recalculation
- **Optimize formulas**: Minimize nested function calls

## 🔄 Updates & Versioning

### Current Version: 1.0.0
- Initial release with core hydraulic functions
- Pump analysis capabilities
- Comprehensive helper functions
- Template integration

### Update Process
1. **Download latest VBA modules**
2. **Remove old modules** from VBA Editor
3. **Import new modules**
4. **Test functionality** with `=ENGIVAULT_VERSION()`

## 🤝 Support

### Getting Help
- **📖 Documentation**: [Function Reference](documentation/Function_Reference.md)
- **🛠️ Installation**: [Installation Guide](documentation/Installation_Guide.md)
- **📧 Email**: support@engivault.com
- **💬 Community**: [GitHub Discussions](https://github.com/Luqman-Ismat/engivault-excel-integration/discussions)

### Reporting Issues
1. **Check** [Function Reference](documentation/Function_Reference.md) for proper usage
2. **Test** with `=ENGIVAULT_API_STATUS()`
3. **Report** via [GitHub Issues](https://github.com/Luqman-Ismat/engivault-excel-integration/issues)
4. **Include** Excel version, error message, and sample data

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **EngiVault API**: Powering the calculations
- **Microsoft Excel**: Providing the platform
- **Engineering Community**: Inspiring the features
- **Contributors**: Making it better

---

**🎉 Start engineering in Excel today!**

Transform your spreadsheets into powerful engineering calculation tools with EngiVault's professional-grade functions.
