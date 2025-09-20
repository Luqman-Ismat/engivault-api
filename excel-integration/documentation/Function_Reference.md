# EngiVault Excel Functions - Complete Reference

## Overview

This reference guide covers all available EngiVault functions for Excel, including parameters, return values, and usage examples.

## Function Categories

- [Hydraulic Calculations](#hydraulic-calculations)
- [Pump Calculations](#pump-calculations)
- [Utility Functions](#utility-functions)
- [Fluid Properties](#fluid-properties)
- [Unit Conversions](#unit-conversions)
- [Validation Functions](#validation-functions)
- [System Functions](#system-functions)

---

## Hydraulic Calculations

### ENGIVAULT_PRESSURE_DROP
Calculate pressure drop using Darcy-Weisbach equation.

**Syntax:**
```excel
ENGIVAULT_PRESSURE_DROP(flowRate, pipeDiameter, pipeLength, fluidDensity, fluidViscosity, [pipeRoughness])
```

**Parameters:**
- `flowRate` (Double): Flow rate in m³/s
- `pipeDiameter` (Double): Pipe diameter in meters
- `pipeLength` (Double): Pipe length in meters
- `fluidDensity` (Double): Fluid density in kg/m³
- `fluidViscosity` (Double): Fluid viscosity in Pa·s
- `pipeRoughness` (Double, Optional): Pipe roughness in meters (default: 0.00015)

**Returns:** Pressure drop in Pa

**Example:**
```excel
=ENGIVAULT_PRESSURE_DROP(0.1, 0.1, 100, 1000, 0.001)
Result: 762517.46
```

### ENGIVAULT_FLOW_RATE
Calculate flow rate from pressure drop.

**Syntax:**
```excel
ENGIVAULT_FLOW_RATE(pressureDrop, pipeDiameter, pipeLength, fluidDensity, fluidViscosity, [pipeRoughness])
```

**Parameters:**
- `pressureDrop` (Double): Pressure drop in Pa
- `pipeDiameter` (Double): Pipe diameter in meters
- `pipeLength` (Double): Pipe length in meters
- `fluidDensity` (Double): Fluid density in kg/m³
- `fluidViscosity` (Double): Fluid viscosity in Pa·s
- `pipeRoughness` (Double, Optional): Pipe roughness in meters (default: 0.00015)

**Returns:** Flow rate in m³/s

**Example:**
```excel
=ENGIVAULT_FLOW_RATE(10000, 0.1, 100, 1000, 0.001)
Result: 0.0356
```

### ENGIVAULT_REYNOLDS_NUMBER
Calculate Reynolds number for pipe flow.

**Syntax:**
```excel
ENGIVAULT_REYNOLDS_NUMBER(flowRate, pipeDiameter, fluidDensity, fluidViscosity)
```

**Parameters:**
- `flowRate` (Double): Flow rate in m³/s
- `pipeDiameter` (Double): Pipe diameter in meters
- `fluidDensity` (Double): Fluid density in kg/m³
- `fluidViscosity` (Double): Fluid viscosity in Pa·s

**Returns:** Reynolds number (dimensionless)

**Example:**
```excel
=ENGIVAULT_REYNOLDS_NUMBER(0.1, 0.1, 1000, 0.001)
Result: 1273240
```

---

## Pump Calculations

### ENGIVAULT_PUMP_POWER
Calculate pump hydraulic power.

**Syntax:**
```excel
ENGIVAULT_PUMP_POWER(flowRate, head, efficiency, power)
```

**Parameters:**
- `flowRate` (Double): Flow rate in m³/s
- `head` (Double): Pump head in meters
- `efficiency` (Double): Pump efficiency (0-1)
- `power` (Double): Pump power in watts

**Returns:** Hydraulic power in kW

**Example:**
```excel
=ENGIVAULT_PUMP_POWER(0.05, 50, 0.8, 5000)
Result: 0.025
```

### ENGIVAULT_NPSH_AVAILABLE
Calculate Net Positive Suction Head Available.

**Syntax:**
```excel
ENGIVAULT_NPSH_AVAILABLE(suctionPressure, vaporPressure, fluidDensity, suctionVelocity, suctionLosses)
```

**Parameters:**
- `suctionPressure` (Double): Suction pressure in Pa
- `vaporPressure` (Double): Vapor pressure in Pa
- `fluidDensity` (Double): Fluid density in kg/m³
- `suctionVelocity` (Double): Suction velocity in m/s
- `suctionLosses` (Double): Suction losses in meters

**Returns:** NPSH Available in meters

**Example:**
```excel
=ENGIVAULT_NPSH_AVAILABLE(101325, 2337, 1000, 2.0, 1.5)
Result: 8.45
```

---

## Utility Functions

### ENGIVAULT_PIPE_VELOCITY
Calculate fluid velocity in pipe.

**Syntax:**
```excel
ENGIVAULT_PIPE_VELOCITY(flowRate, pipeDiameter)
```

**Parameters:**
- `flowRate` (Double): Flow rate in m³/s
- `pipeDiameter` (Double): Pipe diameter in meters

**Returns:** Velocity in m/s

**Example:**
```excel
=ENGIVAULT_PIPE_VELOCITY(0.1, 0.1)
Result: 12.73
```

### ENGIVAULT_PIPE_AREA
Calculate pipe cross-sectional area.

**Syntax:**
```excel
ENGIVAULT_PIPE_AREA(pipeDiameter)
```

**Parameters:**
- `pipeDiameter` (Double): Pipe diameter in meters

**Returns:** Area in m²

**Example:**
```excel
=ENGIVAULT_PIPE_AREA(0.1)
Result: 0.007854
```

---

## Fluid Properties

### WATER_DENSITY
Get water density at given temperature.

**Syntax:**
```excel
WATER_DENSITY(temperature)
```

**Parameters:**
- `temperature` (Double): Temperature in Celsius (0-100°C)

**Returns:** Density in kg/m³

**Example:**
```excel
=WATER_DENSITY(20)
Result: 998.2
```

### WATER_VISCOSITY
Get water dynamic viscosity at given temperature.

**Syntax:**
```excel
WATER_VISCOSITY(temperature)
```

**Parameters:**
- `temperature` (Double): Temperature in Celsius (0-100°C)

**Returns:** Dynamic viscosity in Pa·s

**Example:**
```excel
=WATER_VISCOSITY(20)
Result: 0.001002
```

### WATER_VAPOR_PRESSURE
Get water vapor pressure at given temperature.

**Syntax:**
```excel
WATER_VAPOR_PRESSURE(temperature)
```

**Parameters:**
- `temperature` (Double): Temperature in Celsius (1-100°C)

**Returns:** Vapor pressure in Pa

**Example:**
```excel
=WATER_VAPOR_PRESSURE(20)
Result: 2337
```

---

## Unit Conversions

### CONVERT_FLOW_RATE
Convert flow rate between different units.

**Syntax:**
```excel
CONVERT_FLOW_RATE(value, fromUnit, toUnit)
```

**Parameters:**
- `value` (Double): Flow rate value
- `fromUnit` (String): Source unit (m3/s, m3/h, l/s, l/min, gpm, cfm)
- `toUnit` (String): Target unit (m3/s, m3/h, l/s, l/min, gpm, cfm)

**Returns:** Converted flow rate

**Example:**
```excel
=CONVERT_FLOW_RATE(100, "gpm", "m3/s")
Result: 0.006309
```

### CONVERT_PRESSURE
Convert pressure between different units.

**Syntax:**
```excel
CONVERT_PRESSURE(value, fromUnit, toUnit)
```

**Parameters:**
- `value` (Double): Pressure value
- `fromUnit` (String): Source unit (Pa, kPa, bar, psi, atm, mmHg)
- `toUnit` (String): Target unit (Pa, kPa, bar, psi, atm, mmHg)

**Returns:** Converted pressure

**Example:**
```excel
=CONVERT_PRESSURE(14.7, "psi", "Pa")
Result: 101353
```

### CONVERT_LENGTH
Convert length between different units.

**Syntax:**
```excel
CONVERT_LENGTH(value, fromUnit, toUnit)
```

**Parameters:**
- `value` (Double): Length value
- `fromUnit` (String): Source unit (m, cm, mm, in, ft)
- `toUnit` (String): Target unit (m, cm, mm, in, ft)

**Returns:** Converted length

**Example:**
```excel
=CONVERT_LENGTH(4, "in", "m")
Result: 0.1016
```

---

## Validation Functions

### VALIDATE_FLOW_REGIME
Determine flow regime based on Reynolds number.

**Syntax:**
```excel
VALIDATE_FLOW_REGIME(reynoldsNumber)
```

**Parameters:**
- `reynoldsNumber` (Double): Reynolds number

**Returns:** Flow regime (Laminar, Transitional, Turbulent)

**Example:**
```excel
=VALIDATE_FLOW_REGIME(50000)
Result: "Turbulent"
```

### VALIDATE_VELOCITY
Check if velocity is within recommended ranges.

**Syntax:**
```excel
VALIDATE_VELOCITY(velocity, application)
```

**Parameters:**
- `velocity` (Double): Velocity in m/s
- `application` (String): Application type (water, steam, gas, oil)

**Returns:** Validation result (OK, High, Low)

**Example:**
```excel
=VALIDATE_VELOCITY(2.5, "water")
Result: "OK"
```

---

## Pipe Sizing Functions

### PIPE_SIZE_RECOMMENDATION
Recommend minimum pipe diameter based on flow rate and maximum velocity.

**Syntax:**
```excel
PIPE_SIZE_RECOMMENDATION(flowRate, maxVelocity, [unit])
```

**Parameters:**
- `flowRate` (Double): Flow rate in m³/s
- `maxVelocity` (Double): Maximum allowable velocity in m/s
- `unit` (String, Optional): Output unit (m, mm, in) - default: m

**Returns:** Minimum pipe diameter

**Example:**
```excel
=PIPE_SIZE_RECOMMENDATION(0.1, 3.0, "mm")
Result: 205.7
```

### STANDARD_PIPE_SIZE
Get next larger standard pipe size.

**Syntax:**
```excel
STANDARD_PIPE_SIZE(calculatedDiameter, [unit], [standard])
```

**Parameters:**
- `calculatedDiameter` (Double): Calculated diameter
- `unit` (String, Optional): Input/output unit (m, mm, in) - default: m
- `standard` (String, Optional): Pipe standard (ANSI, ISO) - default: ANSI

**Returns:** Standard pipe diameter

**Example:**
```excel
=STANDARD_PIPE_SIZE(0.095, "m", "ANSI")
Result: 0.1
```

---

## System Functions

### ENGIVAULT_VERSION
Get EngiVault Excel integration version.

**Syntax:**
```excel
ENGIVAULT_VERSION()
```

**Returns:** Version string

**Example:**
```excel
=ENGIVAULT_VERSION()
Result: "1.0.0"
```

### ENGIVAULT_API_STATUS
Check EngiVault API status.

**Syntax:**
```excel
ENGIVAULT_API_STATUS()
```

**Returns:** API status (Online, Offline, Unknown)

**Example:**
```excel
=ENGIVAULT_API_STATUS()
Result: "Online"
```

---

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| #VALUE! | Invalid input parameters | Check parameter types and ranges |
| #NAME? | Function not recognized | Import VBA modules and enable macros |
| #N/A | API connection failed | Check authentication and internet connection |
| 1001 | Authentication required | Set API key or JWT token |
| 1002 | API request failed | Check API status and parameters |
| 1003 | Invalid response format | Contact support if persistent |
| 2001-2011 | Helper function errors | Check parameter ranges and units |

## Best Practices

### Performance Optimization
1. **Minimize API calls** - Cache results when possible
2. **Use manual calculation** for large datasets
3. **Batch similar calculations** together
4. **Avoid array formulas** with API functions

### Error Handling
1. **Use IFERROR()** to handle API failures gracefully
2. **Validate inputs** before calling functions
3. **Check API status** periodically
4. **Monitor rate limits** for heavy usage

### Formula Examples
```excel
' Safe pressure drop calculation with error handling
=IFERROR(ENGIVAULT_PRESSURE_DROP(A1,B1,C1,D1,E1), "Error: Check inputs")

' Conditional calculation based on flow regime
=IF(VALIDATE_FLOW_REGIME(ENGIVAULT_REYNOLDS_NUMBER(A1,B1,C1,D1))="Turbulent", 
     ENGIVAULT_PRESSURE_DROP(A1,B1,C1,D1,E1), 
     "Laminar flow - use different method")

' Unit conversion with validation
=IF(A1>0, CONVERT_FLOW_RATE(A1,"gpm","m3/s"), "Invalid flow rate")
```

---

**📚 For more examples and templates, see the Examples folder in the EngiVault Excel Integration package.**
