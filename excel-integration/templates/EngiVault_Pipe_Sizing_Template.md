# EngiVault Pipe Sizing Template

This document describes the Excel template for pipe sizing calculations using EngiVault functions.

## Template Structure

### Sheet 1: Input Parameters
| Cell | Parameter | Value | Unit | Description |
|------|-----------|-------|------|-------------|
| B3   | Flow Rate | 0.1   | m³/s | Required flow rate |
| B4   | Pipe Length | 100 | m | Total pipe length |
| B5   | Fluid Density | 1000 | kg/m³ | Fluid density (water at 20°C) |
| B6   | Fluid Viscosity | 0.001 | Pa·s | Dynamic viscosity (water at 20°C) |
| B7   | Pipe Roughness | 0.00015 | m | Absolute pipe roughness |
| B8   | Max Pressure Drop | 50000 | Pa | Maximum allowable pressure drop |
| B9   | Max Velocity | 3.0 | m/s | Maximum allowable velocity |

### Sheet 2: Pipe Size Analysis
| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|----------|----------|----------|----------|----------|----------|----------|
| Diameter (m) | Area (m²) | Velocity (m/s) | Reynolds | Pressure Drop (Pa) | Status | Recommendation |
| 0.08 | =ENGIVAULT_PIPE_AREA(A2) | =ENGIVAULT_PIPE_VELOCITY($Input.$B$3,A2) | =ENGIVAULT_REYNOLDS_NUMBER($Input.$B$3,A2,$Input.$B$5,$Input.$B$6) | =ENGIVAULT_PRESSURE_DROP($Input.$B$3,A2,$Input.$B$4,$Input.$B$5,$Input.$B$6,$Input.$B$7) | =IF(E2<=$Input.$B$8,"OK","HIGH ΔP") | =VALIDATE_VELOCITY(C2,"water") |

### Sheet 3: Results Summary
- **Recommended Diameter**: =PIPE_SIZE_RECOMMENDATION(Input.B3,Input.B9,"m")
- **Standard Size**: =STANDARD_PIPE_SIZE(Results.B2,"m","ANSI")
- **Selected Diameter**: [User input based on analysis]
- **Final Pressure Drop**: =ENGIVAULT_PRESSURE_DROP(Input.B3,Results.B4,Input.B4,Input.B5,Input.B6,Input.B7)
- **Final Velocity**: =ENGIVAULT_PIPE_VELOCITY(Input.B3,Results.B4)
- **Flow Regime**: =VALIDATE_FLOW_REGIME(ENGIVAULT_REYNOLDS_NUMBER(Input.B3,Results.B4,Input.B5,Input.B6))

## Formulas Used

### Basic Calculations
```excel
=ENGIVAULT_PRESSURE_DROP(flow_rate, pipe_diameter, pipe_length, fluid_density, fluid_viscosity, pipe_roughness)
=ENGIVAULT_PIPE_VELOCITY(flow_rate, pipe_diameter)
=ENGIVAULT_REYNOLDS_NUMBER(flow_rate, pipe_diameter, fluid_density, fluid_viscosity)
```

### Helper Functions
```excel
=PIPE_SIZE_RECOMMENDATION(flow_rate, max_velocity, "m")
=STANDARD_PIPE_SIZE(calculated_diameter, "m", "ANSI")
=VALIDATE_VELOCITY(velocity, "water")
=VALIDATE_FLOW_REGIME(reynolds_number)
```

### Unit Conversions
```excel
=CONVERT_FLOW_RATE(100, "gpm", "m3/s")
=CONVERT_PRESSURE(14.7, "psi", "Pa")
=CONVERT_LENGTH(4, "in", "m")
```

## Setup Instructions

1. **Install VBA Modules**:
   - Import `EngiVaultAPI.bas`
   - Import `EngiVaultHelpers.bas`

2. **Set API Authentication**:
   ```vba
   Sub SetupEngiVault()
       Call SetEngiVaultJWTToken("your-jwt-token-here")
   End Sub
   ```

3. **Enable Macros**: 
   - Save as `.xlsm` file
   - Enable macros when opening

4. **Test Connection**:
   - Use `=ENGIVAULT_API_STATUS()` to verify connection

## Color Coding

- **Green**: Acceptable values
- **Yellow**: Marginal values (review recommended)
- **Red**: Unacceptable values (change required)

## Conditional Formatting Rules

### Pressure Drop Status
- Green: ≤ Max Pressure Drop
- Red: > Max Pressure Drop

### Velocity Status
- Green: 0.9 ≤ velocity ≤ 3.0 m/s (for water)
- Yellow: 0.6 ≤ velocity < 0.9 m/s or 3.0 < velocity ≤ 4.0 m/s
- Red: velocity < 0.6 m/s or velocity > 4.0 m/s

### Reynolds Number
- Blue: < 2300 (Laminar)
- Yellow: 2300-4000 (Transitional)
- Green: > 4000 (Turbulent)
