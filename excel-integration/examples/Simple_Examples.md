# EngiVault Excel Integration - Simple Examples

## Getting Started Examples

These examples demonstrate basic usage of EngiVault functions in Excel.

## Example 1: Basic Pressure Drop Calculation

### Scenario
Calculate pressure drop for water flowing through a 100mm diameter pipe.

### Setup
| Cell | Parameter | Value | Unit |
|------|-----------|-------|------|
| A1   | Flow Rate | 0.05 | m³/s |
| A2   | Pipe Diameter | 0.1 | m |
| A3   | Pipe Length | 150 | m |
| A4   | Water Density | 1000 | kg/m³ |
| A5   | Water Viscosity | 0.001 | Pa·s |

### Calculation
```excel
=ENGIVAULT_PRESSURE_DROP(A1,A2,A3,A4,A5)
```
**Result**: 47,657 Pa (47.7 kPa)

### Additional Analysis
```excel
' Velocity
=ENGIVAULT_PIPE_VELOCITY(A1,A2)
Result: 6.37 m/s

' Reynolds Number
=ENGIVAULT_REYNOLDS_NUMBER(A1,A2,A4,A5)
Result: 636,620

' Flow Regime
=VALIDATE_FLOW_REGIME(636620)
Result: "Turbulent"
```

## Example 2: Pump Power Calculation

### Scenario
Determine hydraulic power for a centrifugal pump.

### Setup
| Cell | Parameter | Value | Unit |
|------|-----------|-------|------|
| B1   | Flow Rate | 0.08 | m³/s |
| B2   | Pump Head | 35 | m |
| B3   | Efficiency | 0.75 | - |
| B4   | Motor Power | 6000 | W |

### Calculation
```excel
=ENGIVAULT_PUMP_POWER(B1,B2,B3,B4)
```
**Result**: 0.0367 kW (36.7 W hydraulic power)

### Power Analysis
```excel
' Theoretical hydraulic power
=(B1*B2*1000*9.81)/1000
Result: 27.5 kW

' Actual power consumption
=B4/1000
Result: 6.0 kW

' Overall efficiency
=(27.5/6.0)*100
Result: 458% (Error - check calculation)
```

## Example 3: Unit Conversions

### Flow Rate Conversions
```excel
' Convert 100 GPM to m³/s
=CONVERT_FLOW_RATE(100,"gpm","m3/s")
Result: 0.006309

' Convert 50 L/min to m³/h
=CONVERT_FLOW_RATE(50,"l/min","m3/h")
Result: 3.0

' Convert 0.1 m³/s to GPM
=CONVERT_FLOW_RATE(0.1,"m3/s","gpm")
Result: 1585.0
```

### Pressure Conversions
```excel
' Convert 50 psi to Pa
=CONVERT_PRESSURE(50,"psi","Pa")
Result: 344,738

' Convert 2 bar to psi
=CONVERT_PRESSURE(2,"bar","psi")
Result: 29.01

' Convert 1 atm to kPa
=CONVERT_PRESSURE(1,"atm","kPa")
Result: 101.325
```

### Length Conversions
```excel
' Convert 4 inches to mm
=CONVERT_LENGTH(4,"in","mm")
Result: 101.6

' Convert 6 feet to meters
=CONVERT_LENGTH(6,"ft","m")
Result: 1.829

' Convert 150 mm to inches
=CONVERT_LENGTH(150,"mm","in")
Result: 5.906
```

## Example 4: Water Properties

### Temperature-Based Properties
| Temperature (°C) | Density | Viscosity | Vapor Pressure |
|------------------|---------|-----------|----------------|
| 10 | =WATER_DENSITY(10) | =WATER_VISCOSITY(10) | =WATER_VAPOR_PRESSURE(10) |
| 20 | =WATER_DENSITY(20) | =WATER_VISCOSITY(20) | =WATER_VAPOR_PRESSURE(20) |
| 50 | =WATER_DENSITY(50) | =WATER_VISCOSITY(50) | =WATER_VAPOR_PRESSURE(50) |
| 80 | =WATER_DENSITY(80) | =WATER_VISCOSITY(80) | =WATER_VAPOR_PRESSURE(80) |

**Results:**
| Temperature | Density (kg/m³) | Viscosity (Pa·s) | Vapor Pressure (Pa) |
|-------------|-----------------|------------------|---------------------|
| 10°C | 999.7 | 0.001307 | 1,227 |
| 20°C | 998.2 | 0.001002 | 2,337 |
| 50°C | 988.0 | 0.000547 | 12,344 |
| 80°C | 971.8 | 0.000355 | 47,373 |

## Example 5: Pipe Sizing

### Scenario
Size a pipe for 200 GPM water flow with maximum 6 ft/s velocity.

### Calculation
```excel
' Convert flow rate to m³/s
=CONVERT_FLOW_RATE(200,"gpm","m3/s")
Result: 0.01262 m³/s

' Convert max velocity to m/s
=CONVERT_LENGTH(6,"ft","m")
Result: 1.829 m/s (this is length, not velocity)

' Correct velocity conversion (6 ft/s to m/s)
=6*0.3048
Result: 1.829 m/s

' Recommend minimum diameter
=PIPE_SIZE_RECOMMENDATION(0.01262,1.829,"in")
Result: 3.33 inches

' Get standard pipe size
=STANDARD_PIPE_SIZE(3.33,"in","ANSI")
Result: 4 inches

' Verify actual velocity with 4" pipe
=ENGIVAULT_PIPE_VELOCITY(0.01262,CONVERT_LENGTH(4,"in","m"))
Result: 1.55 m/s (5.08 ft/s) ✓
```

## Example 6: NPSH Analysis

### Scenario
Check NPSH for a pump installation.

### System Data
| Parameter | Value | Unit |
|-----------|-------|------|
| Suction Pressure | 101,325 | Pa (atmospheric) |
| Water Temperature | 60°C | - |
| Suction Velocity | 2.5 | m/s |
| Suction Losses | 1.8 | m |

### Calculation
```excel
' Get vapor pressure at temperature
=WATER_VAPOR_PRESSURE(60)
Result: 19,932 Pa

' Get water density at temperature
=WATER_DENSITY(60)
Result: 983.2 kg/m³

' Calculate NPSH Available
=ENGIVAULT_NPSH_AVAILABLE(101325,19932,983.2,2.5,1.8)
Result: 6.45 m

' Check safety (assuming 4m NPSH required)
=6.45-4
Result: 2.45 m margin ✓ Safe
```

## Example 7: System Analysis Table

### Multi-Diameter Analysis
Create a table comparing different pipe diameters:

| Diameter (in) | Diameter (m) | Velocity (m/s) | Re Number | Pressure Drop (Pa) | Status |
|---------------|--------------|----------------|-----------|-------------------|--------|
| 3 | =CONVERT_LENGTH(3,"in","m") | =ENGIVAULT_PIPE_VELOCITY($B$1,B8) | =ENGIVAULT_REYNOLDS_NUMBER($B$1,B8,$B$4,$B$5) | =ENGIVAULT_PRESSURE_DROP($B$1,B8,$B$3,$B$4,$B$5) | =IF(E8<50000,"OK","HIGH") |
| 4 | =CONVERT_LENGTH(4,"in","m") | =ENGIVAULT_PIPE_VELOCITY($B$1,B9) | =ENGIVAULT_REYNOLDS_NUMBER($B$1,B9,$B$4,$B$5) | =ENGIVAULT_PRESSURE_DROP($B$1,B9,$B$3,$B$4,$B$5) | =IF(E9<50000,"OK","HIGH") |
| 6 | =CONVERT_LENGTH(6,"in","m") | =ENGIVAULT_PIPE_VELOCITY($B$1,B10) | =ENGIVAULT_REYNOLDS_NUMBER($B$1,B10,$B$4,$B$5) | =ENGIVAULT_PRESSURE_DROP($B$1,B10,$B$3,$B$4,$B$5) | =IF(E10<50000,"OK","HIGH") |

## Example 8: Error Handling

### Safe Formulas with Error Checking
```excel
' Pressure drop with error handling
=IFERROR(ENGIVAULT_PRESSURE_DROP(A1,A2,A3,A4,A5), "Error: Check inputs")

' Conditional calculation
=IF(AND(A1>0,A2>0,A3>0,A4>0,A5>0), 
    ENGIVAULT_PRESSURE_DROP(A1,A2,A3,A4,A5), 
    "Invalid inputs")

' API status check
=IF(ENGIVAULT_API_STATUS()="Online", 
    ENGIVAULT_PRESSURE_DROP(A1,A2,A3,A4,A5), 
    "API Offline")

' Range validation
=IF(AND(A1>0,A1<10), 
    ENGIVAULT_PRESSURE_DROP(A1,A2,A3,A4,A5), 
    "Flow rate out of range")
```

## Example 9: Quick Reference Formulas

### Common Calculations
```excel
' Standard water properties at 20°C
Density:     =WATER_DENSITY(20)        ' 998.2 kg/m³
Viscosity:   =WATER_VISCOSITY(20)      ' 0.001002 Pa·s
Vapor Press: =WATER_VAPOR_PRESSURE(20) ' 2,337 Pa

' Pipe geometry
Area:        =ENGIVAULT_PIPE_AREA(0.1)         ' 0.007854 m²
Velocity:    =ENGIVAULT_PIPE_VELOCITY(0.05,0.1) ' 6.37 m/s

' Flow analysis
Reynolds:    =ENGIVAULT_REYNOLDS_NUMBER(0.05,0.1,998.2,0.001002)
Flow Regime: =VALIDATE_FLOW_REGIME(318310)     ' "Turbulent"
Vel Status:  =VALIDATE_VELOCITY(6.37,"water")  ' "High"

' Unit conversions
GPM to m³/s: =CONVERT_FLOW_RATE(100,"gpm","m3/s")  ' 0.006309
PSI to Pa:   =CONVERT_PRESSURE(50,"psi","Pa")       ' 344,738
Inch to mm:  =CONVERT_LENGTH(4,"in","mm")           ' 101.6
```

## Example 10: Template Structure

### Basic Calculation Sheet Layout
```
A1: "EngiVault Calculations"
A3: "Input Parameters"
A4: "Flow Rate (m³/s):"        B4: 0.05
A5: "Pipe Diameter (m):"       B5: 0.1
A6: "Pipe Length (m):"         B6: 100
A7: "Fluid Density (kg/m³):"   B7: 1000
A8: "Fluid Viscosity (Pa·s):"  B8: 0.001

A10: "Results"
A11: "Pressure Drop (Pa):"     B11: =ENGIVAULT_PRESSURE_DROP(B4,B5,B6,B7,B8)
A12: "Velocity (m/s):"         B12: =ENGIVAULT_PIPE_VELOCITY(B4,B5)
A13: "Reynolds Number:"        B13: =ENGIVAULT_REYNOLDS_NUMBER(B4,B5,B7,B8)
A14: "Flow Regime:"            B14: =VALIDATE_FLOW_REGIME(B13)
A15: "Velocity Status:"        B15: =VALIDATE_VELOCITY(B12,"water")

A17: "API Status:"             B17: =ENGIVAULT_API_STATUS()
A18: "Version:"                B18: =ENGIVAULT_VERSION()
```

## Tips for Success

### 1. Start Simple
- Begin with single calculations
- Verify results manually when possible
- Use known test cases

### 2. Build Gradually
- Add error handling as you go
- Create reusable templates
- Document your formulas

### 3. Optimize Performance
- Cache repeated calculations
- Use manual calculation mode
- Minimize API calls

### 4. Handle Errors Gracefully
- Always use IFERROR() for API functions
- Validate inputs before calculation
- Provide meaningful error messages

**🎉 You're ready to start using EngiVault in Excel!**
