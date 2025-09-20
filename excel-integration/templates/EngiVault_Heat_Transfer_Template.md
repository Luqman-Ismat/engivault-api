# EngiVault Heat Transfer Template

This document describes the Excel template for heat transfer calculations using EngiVault functions.

## Template Structure

### Sheet 1: Heat Exchanger Design
| Cell | Parameter | Value | Unit | Description |
|------|-----------|-------|------|-------------|
| B3   | Heat Duty | 100000 | W | Required heat transfer rate |
| B4   | Hot Inlet Temp | 80 | °C | Hot fluid inlet temperature |
| B5   | Hot Outlet Temp | 60 | °C | Hot fluid outlet temperature |
| B6   | Cold Inlet Temp | 20 | °C | Cold fluid inlet temperature |
| B7   | Cold Outlet Temp | 40 | °C | Cold fluid outlet temperature |
| B8   | Overall U | 500 | W/m²·K | Overall heat transfer coefficient |
| B9   | Flow Arrangement | counterflow | - | Flow configuration |

### Sheet 2: Heat Exchanger Analysis
| Parameter | Formula | Result | Unit |
|-----------|---------|--------|------|
| Hot Inlet (K) | =CELSIUS_TO_KELVIN(Design.B4) | | K |
| Hot Outlet (K) | =CELSIUS_TO_KELVIN(Design.B5) | | K |
| Cold Inlet (K) | =CELSIUS_TO_KELVIN(Design.B6) | | K |
| Cold Outlet (K) | =CELSIUS_TO_KELVIN(Design.B7) | | K |
| LMTD | =ENGIVAULT_LMTD(B2,B3,B4,B5,Design.B9) | | K |
| Required Area | =ENGIVAULT_HEAT_EXCHANGER_AREA(Design.B3,Design.B8,B2,B3,B4,B5,Design.B9) | | m² |
| Effectiveness | =ENGIVAULT_EFFECTIVENESS(NTU_FROM_AREA(B7,Design.B8,MIN(C_hot,C_cold)),MIN(C_hot,C_cold)/MAX(C_hot,C_cold),Design.B9) | | - |

### Sheet 3: Thermal Analysis
| Parameter | Formula | Result | Unit | Notes |
|-----------|---------|--------|------|-------|
| Hot ΔT | =Design.B4-Design.B5 | | K | Temperature drop |
| Cold ΔT | =Design.B7-Design.B6 | | K | Temperature rise |
| Hot Capacity Rate | =Design.B3/(Design.B4-Design.B5) | | W/K | Assuming heat balance |
| Cold Capacity Rate | =Design.B3/(Design.B7-Design.B6) | | W/K | Assuming heat balance |
| Min Capacity Rate | =MIN(B3,B4) | | W/K | Cmin |
| Max Capacity Rate | =MAX(B3,B4) | | W/K | Cmax |
| Capacity Ratio | =B5/B6 | | - | Cmin/Cmax |
| NTU | =NTU_FROM_AREA(Analysis.B7,Design.B8,B5) | | - | Number of transfer units |

### Sheet 4: Fluid Properties (Water Example)
| Temperature (°C) | Density | Viscosity | Thermal Cond. | Specific Heat | Prandtl |
|------------------|---------|-----------|---------------|---------------|---------|
| 20 | =WATER_DENSITY(A2) | =WATER_VISCOSITY(A2) | =THERMAL_CONDUCTIVITY_WATER(A2) | =SPECIFIC_HEAT_WATER(A2) | =PRANDTL_NUMBER_WATER(A2) |
| 40 | =WATER_DENSITY(A3) | =WATER_VISCOSITY(A3) | =THERMAL_CONDUCTIVITY_WATER(A3) | =SPECIFIC_HEAT_WATER(A3) | =PRANDTL_NUMBER_WATER(A3) |
| 60 | =WATER_DENSITY(A4) | =WATER_VISCOSITY(A4) | =THERMAL_CONDUCTIVITY_WATER(A4) | =SPECIFIC_HEAT_WATER(A4) | =PRANDTL_NUMBER_WATER(A4) |
| 80 | =WATER_DENSITY(A5) | =WATER_VISCOSITY(A5) | =THERMAL_CONDUCTIVITY_WATER(A5) | =SPECIFIC_HEAT_WATER(A5) | =PRANDTL_NUMBER_WATER(A5) |

### Sheet 5: Heat Transfer Coefficients
| Geometry | Reynolds | Prandtl | Nusselt | HTC (W/m²·K) | Notes |
|----------|----------|---------|---------|--------------|-------|
| Flat Plate | 50000 | 7 | =NUSSELT_FLAT_PLATE(B2,C2) | =HEAT_TRANSFER_COEFFICIENT(D2,0.6,0.1) | External flow |
| Tube Internal | 10000 | 7 | =NUSSELT_TUBE_INTERNAL(B3,C3) | =HEAT_TRANSFER_COEFFICIENT(D3,0.6,0.05) | Internal flow |

### Sheet 6: Economic Analysis
| Parameter | Formula | Result | Unit |
|-----------|---------|--------|------|
| Heat Exchanger Area | =Analysis.B7 | | m² |
| Material | stainless_steel | | - |
| Design Pressure | 10 | | bar |
| Estimated Cost | =HEAT_EXCHANGER_COST_ESTIMATE(B2,B3,B4) | | USD |
| Cost per m² | =B5/B2 | | USD/m² |
| Cost per kW | =B5/(Design.B3/1000) | | USD/kW |

## Advanced Formulas

### Heat Exchanger Sizing Optimization
```excel
' Find optimal area for target effectiveness
=SOLVER(SET: Effectiveness_Cell, TO: 0.8, BY: Area_Cell)
```

### Multi-Pass Heat Exchanger
```excel
' Calculate for shell-and-tube with multiple passes
=ENGIVAULT_HEAT_EXCHANGER_AREA(Q_total/passes, U_effective, T_hot_in, T_hot_out, T_cold_in, T_cold_out)
```

### Temperature Profile Analysis
```excel
' Calculate temperature at intermediate points
=T_hot_in - (T_hot_in - T_hot_out) * (position/total_length)
```

## Real-World Examples

### Example 1: Cooling Water Heat Exchanger
**Application**: Cool process fluid from 90°C to 50°C using cooling water (15°C → 35°C)

**Setup:**
```excel
Heat Duty:     =HEAT_DUTY_REQUIRED(mass_flow, cp_process, 40)
Hot Inlet:     =CELSIUS_TO_KELVIN(90)
Hot Outlet:    =CELSIUS_TO_KELVIN(50)
Cold Inlet:    =CELSIUS_TO_KELVIN(15)
Cold Outlet:   =CELSIUS_TO_KELVIN(35)
Overall U:     800  ' W/m²·K (typical for water-water)
```

**Analysis:**
```excel
LMTD:          =ENGIVAULT_LMTD(B6,B7,B8,B9,"counterflow")
Area Required: =ENGIVAULT_HEAT_EXCHANGER_AREA(B3,B10,B6,B7,B8,B9)
Effectiveness: =ENGIVAULT_EFFECTIVENESS(NTU_calc, C_ratio, "counterflow")
```

### Example 2: Steam Condenser
**Application**: Condense steam at 100°C using cooling water (20°C → 80°C)

**Setup:**
```excel
Steam Temp:    =CELSIUS_TO_KELVIN(100)
Water In:      =CELSIUS_TO_KELVIN(20)
Water Out:     =CELSIUS_TO_KELVIN(80)
Latent Heat:   2260000  ' J/kg for steam
Mass Flow:     5        ' kg/s steam
Heat Duty:     =B5*B6   ' W
```

### Example 3: Air-Cooled Heat Exchanger
**Application**: Cool oil using ambient air

**Setup:**
```excel
Oil In:        =CELSIUS_TO_KELVIN(120)
Oil Out:       =CELSIUS_TO_KELVIN(80)
Air In:        =CELSIUS_TO_KELVIN(25)
Air Out:       =CELSIUS_TO_KELVIN(45)
Overall U:     50      ' W/m²·K (typical for air-oil)
```

## Validation and Safety Checks

### Temperature Validation
```excel
' Check temperature feasibility
=IF(AND(Hot_In>Hot_Out, Cold_Out>Cold_In), "✓ Valid", "✗ Invalid temperatures")

' Check approach temperature
=MIN(Hot_Out-Cold_Out, Hot_In-Cold_In)
=IF(B2>5, "✓ Adequate approach", "⚠ Low approach temperature")
```

### Heat Balance Check
```excel
' Verify energy balance
Hot_Side_Q:   =m_hot * cp_hot * (T_hot_in - T_hot_out)
Cold_Side_Q:  =m_cold * cp_cold * (T_cold_out - T_cold_in)
Balance_Error: =ABS(B2-B3)/B2*100
=IF(B4<5, "✓ Balanced", "⚠ Heat balance error: " & B4 & "%")
```

### Design Validation
```excel
' Overall design check
=VALIDATE_HEAT_EXCHANGER(effectiveness, 0, v_hot, v_cold)
```

## Performance Optimization

### Sensitivity Analysis
Create a table varying key parameters:

| Overall U | Area (m²) | Cost (USD) | Effectiveness |
|-----------|-----------|------------|---------------|
| 300 | =ENGIVAULT_HEAT_EXCHANGER_AREA(Q,A2,T_h_in,T_h_out,T_c_in,T_c_out) | =HEAT_EXCHANGER_COST_ESTIMATE(B2,"SS",10) | =EFFECTIVENESS_calc |
| 500 | =ENGIVAULT_HEAT_EXCHANGER_AREA(Q,A3,T_h_in,T_h_out,T_c_in,T_c_out) | =HEAT_EXCHANGER_COST_ESTIMATE(B3,"SS",10) | =EFFECTIVENESS_calc |
| 800 | =ENGIVAULT_HEAT_EXCHANGER_AREA(Q,A4,T_h_in,T_h_out,T_c_in,T_c_out) | =HEAT_EXCHANGER_COST_ESTIMATE(B4,"SS",10) | =EFFECTIVENESS_calc |

### Cost Optimization
```excel
' Find minimum cost design
=MIN(Cost_Range)
=INDEX(U_Range, MATCH(MIN(Cost_Range), Cost_Range, 0))
```

## Charts and Visualizations

### 1. Temperature Profile
- X-axis: Heat exchanger length
- Y-axis: Temperature (°C)
- Series 1: Hot fluid temperature
- Series 2: Cold fluid temperature

### 2. Effectiveness vs NTU
- X-axis: NTU (0-5)
- Y-axis: Effectiveness (0-1)
- Multiple series for different capacity ratios

### 3. Cost vs Area
- X-axis: Heat transfer area (m²)
- Y-axis: Cost (USD)
- Different series for materials

### 4. Performance Map
- X-axis: Flow rate
- Y-axis: Heat transfer rate
- Contour lines for different areas

## Troubleshooting

### Common Issues

#### 1. Negative LMTD
**Cause**: Invalid temperature arrangement
**Solution**: Check that hot inlet > hot outlet and cold outlet > cold inlet

#### 2. Very Large Area
**Cause**: Low overall U or small LMTD
**Solution**: Improve heat transfer coefficient or increase temperature difference

#### 3. Low Effectiveness
**Cause**: Insufficient area or poor flow arrangement
**Solution**: Increase area or consider counterflow arrangement

## Installation Notes

### Required VBA Modules
1. **EngiVaultAPI_Enhanced.bas** - Core API functions
2. **EngiVaultHeatTransfer.bas** - Heat transfer specific functions  
3. **EngiVault_Installer.bas** - Function registration

### Function Categories
All heat transfer functions appear in:
- **EngiVault Heat Transfer** category in Insert Function dialog
- Searchable by typing "ENGIVAULT" or "HEAT"

### Setup Authentication
```vba
Sub SetupHeatTransfer()
    Call SetEngiVaultJWTToken("your-token-here")
    Call InstallEngiVault  ' Registers all functions
End Sub
```

---

**🌡️ This template provides comprehensive heat transfer analysis capabilities directly in Excel, making complex thermal calculations as simple as using built-in Excel functions!**
