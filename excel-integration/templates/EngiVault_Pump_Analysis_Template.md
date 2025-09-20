# EngiVault Pump Analysis Template

This document describes the Excel template for pump selection and analysis using EngiVault functions.

## Template Structure

### Sheet 1: System Requirements
| Cell | Parameter | Value | Unit | Description |
|------|-----------|-------|------|-------------|
| B3   | Required Flow | 0.05 | m³/s | System flow requirement |
| B4   | Static Head | 25 | m | Elevation difference |
| B5   | Pipe Diameter | 0.1 | m | Discharge pipe diameter |
| B6   | Pipe Length | 200 | m | Total pipe length |
| B7   | Fluid Density | 1000 | kg/m³ | Fluid density |
| B8   | Fluid Viscosity | 0.001 | Pa·s | Dynamic viscosity |
| B9   | Safety Factor | 1.2 | - | Design safety factor |
| B10  | Suction Pressure | 101325 | Pa | Suction pressure |
| B11  | Vapor Pressure | 2337 | Pa | Fluid vapor pressure |
| B12  | Suction Losses | 2.0 | m | Suction line losses |

### Sheet 2: System Analysis
| Parameter | Formula | Result | Unit |
|-----------|---------|--------|------|
| Pipe Velocity | =ENGIVAULT_PIPE_VELOCITY(Requirements.B3,Requirements.B5) | | m/s |
| Reynolds Number | =ENGIVAULT_REYNOLDS_NUMBER(Requirements.B3,Requirements.B5,Requirements.B7,Requirements.B8) | | - |
| Friction Losses | =ENGIVAULT_PRESSURE_DROP(Requirements.B3,Requirements.B5,Requirements.B6,Requirements.B7,Requirements.B8) | | Pa |
| Friction Head | =B4/(Requirements.B7*9.81) | | m |
| Total Head Required | =Requirements.B4+B5*Requirements.B9 | | m |

### Sheet 3: Pump Options Comparison
| Pump | Flow (m³/s) | Head (m) | Efficiency | Power (W) | Hydraulic Power (kW) | Status |
|------|-------------|----------|------------|-----------|---------------------|--------|
| Pump A | 0.04 | 45 | 0.75 | 4500 | =ENGIVAULT_PUMP_POWER(B3,C3,D3,E3) | =IF(B3>=System.B2,"✓","✗") |
| Pump B | 0.05 | 50 | 0.80 | 5000 | =ENGIVAULT_PUMP_POWER(B4,C4,D4,E4) | =IF(B4>=System.B2,"✓","✗") |
| Pump C | 0.06 | 55 | 0.78 | 5500 | =ENGIVAULT_PUMP_POWER(B5,C5,D5,E5) | =IF(B5>=System.B2,"✓","✗") |

### Sheet 4: NPSH Analysis
| Parameter | Formula | Result | Unit | Status |
|-----------|---------|--------|------|--------|
| Suction Velocity | =Requirements.B3/ENGIVAULT_PIPE_AREA(0.12) | | m/s | Assumed 120mm suction |
| NPSH Available | =ENGIVAULT_NPSH_AVAILABLE(Requirements.B10,Requirements.B11,Requirements.B7,B2,Requirements.B12) | | m | |
| NPSH Required | 4.0 | | m | Pump specification |
| NPSH Margin | =B3-B4 | | m | =IF(B5>1,"✓ Safe","⚠ Risk") |

### Sheet 5: Economic Analysis
| Pump | Capital Cost | Operating Hours/Year | Power Cost ($/kWh) | Annual Energy Cost | Total 10-Year Cost |
|------|--------------|---------------------|-------------------|-------------------|-------------------|
| Pump A | $5,000 | 8760 | 0.12 | =PumpComparison.F3*C3*D3*8760/1000 | =B3+E3*10 |
| Pump B | $6,000 | 8760 | 0.12 | =PumpComparison.F4*C4*D4*8760/1000 | =B4+E4*10 |
| Pump C | $7,000 | 8760 | 0.12 | =PumpComparison.F5*C5*D5*8760/1000 | =B5+E5*10 |

## Advanced Formulas

### System Curve Calculation
```excel
=ENGIVAULT_PRESSURE_DROP(A2,Requirements.$B$5,Requirements.$B$6,Requirements.$B$7,Requirements.$B$8)
```
Where A2 contains different flow rates (0.01, 0.02, 0.03, ... 0.10)

### Pump Efficiency at Different Operating Points
```excel
=ENGIVAULT_PUMP_POWER(A2,Requirements.$B$4,0.8,5000)
```

### Operating Point Analysis
```excel
=IF(ABS(SystemCurve-PumpCurve)<tolerance,"Operating Point","")
```

## Conditional Formatting

### NPSH Safety
- **Green**: NPSH Margin > 2m (Safe)
- **Yellow**: NPSH Margin 1-2m (Caution)
- **Red**: NPSH Margin < 1m (Dangerous)

### Pump Selection
- **Green**: Flow ≥ Required AND Head ≥ Required
- **Red**: Flow < Required OR Head < Required

### Efficiency
- **Green**: Efficiency > 75%
- **Yellow**: Efficiency 65-75%
- **Red**: Efficiency < 65%

## Charts and Visualizations

### 1. System vs Pump Curves
- X-axis: Flow Rate (m³/s)
- Y-axis: Head (m)
- Series 1: System curve (friction losses + static head)
- Series 2: Pump curve (manufacturer data)
- Intersection: Operating point

### 2. NPSH Chart
- X-axis: Flow Rate (m³/s)
- Y-axis: NPSH (m)
- Series 1: NPSH Available
- Series 2: NPSH Required
- Safe operating region highlighted

### 3. Efficiency vs Flow
- X-axis: Flow Rate (m³/s)
- Y-axis: Efficiency (%)
- Shows pump efficiency curve

### 4. Power Consumption
- X-axis: Flow Rate (m³/s)
- Y-axis: Power (kW)
- Shows power requirement vs flow

## Validation Rules

### Input Validation
```excel
=AND(Requirements.B3>0, Requirements.B4>0, Requirements.B5>0)
```

### Safety Checks
```excel
=IF(NPSH.B5<1,"⚠ CAVITATION RISK","✓ NPSH OK")
=IF(System.B2>3,"⚠ HIGH VELOCITY","✓ VELOCITY OK")
```

### Pump Selection Logic
```excel
=IF(AND(B3>=System.$B$2,C3>=System.$B$6),"SUITABLE","NOT SUITABLE")
```

## Setup Instructions

1. **Import VBA Modules**:
   - `EngiVaultAPI.bas`
   - `EngiVaultHelpers.bas`

2. **Set Authentication**:
   ```vba
   Call SetEngiVaultJWTToken("your-token")
   ```

3. **Enable Iterative Calculations**:
   - File → Options → Formulas
   - Check "Enable iterative calculation"
   - Set maximum iterations: 100

4. **Create Named Ranges**:
   - Requirements: Input parameters
   - System: Calculated system parameters
   - PumpOptions: Pump comparison table

## Troubleshooting

### Common Issues
1. **#VALUE! Error**: Check API authentication
2. **#NAME? Error**: VBA modules not imported
3. **Slow Calculation**: Reduce API calls with caching

### Performance Tips
1. Use `Application.ScreenUpdating = False` during bulk calculations
2. Cache API responses for repeated calculations
3. Use manual calculation mode for large datasets

## Example Use Cases

### Case 1: Water Supply System
- Flow: 0.08 m³/s
- Head: 35m
- Pipe: DN100, 150m length
- Result: Pump selection with efficiency analysis

### Case 2: Cooling Water Circuit
- Flow: 0.12 m³/s
- Head: 20m + friction losses
- NPSH critical analysis
- Result: NPSH-safe pump selection

### Case 3: Chemical Process
- Viscous fluid (μ = 0.05 Pa·s)
- Corrosive environment
- Variable flow requirements
- Result: Pump sizing for worst-case scenario
