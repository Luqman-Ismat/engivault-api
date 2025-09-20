# EngiVault Heat Transfer - Practical Examples

## Example 1: Shell-and-Tube Heat Exchanger Design

### Problem Statement
Design a shell-and-tube heat exchanger to cool 5 kg/s of process oil from 120°C to 80°C using cooling water available at 25°C. The cooling water outlet temperature should not exceed 45°C.

### Solution in Excel

#### Input Parameters
```excel
A1: "Process Oil Cooling - Heat Exchanger Design"
A3: "Process Conditions"
A4: "Oil flow rate (kg/s):"          B4: 5
A5: "Oil inlet temp (°C):"           B5: 120
A6: "Oil outlet temp (°C):"          B6: 80
A7: "Oil specific heat (J/kg·K):"    B7: 2100
A8: "Water inlet temp (°C):"         B8: 25
A9: "Water outlet temp (°C):"        B9: 45
A10: "Overall U (W/m²·K):"           B10: 300
```

#### Calculations
```excel
A12: "Heat Transfer Analysis"
A13: "Heat duty (W):"               B13: =HEAT_DUTY_REQUIRED(B4,B7,B5-B6)
A14: "Water flow rate (kg/s):"      B14: =B13/(4180*(B9-B8))
A15: "Hot inlet (K):"               B15: =CELSIUS_TO_KELVIN(B5)
A16: "Hot outlet (K):"              B16: =CELSIUS_TO_KELVIN(B6)
A17: "Cold inlet (K):"              B17: =CELSIUS_TO_KELVIN(B8)
A18: "Cold outlet (K):"             B18: =CELSIUS_TO_KELVIN(B9)
A19: "LMTD (K):"                    B19: =ENGIVAULT_LMTD(B15,B16,B17,B18,"counterflow")
A20: "Required area (m²):"          B20: =ENGIVAULT_HEAT_EXCHANGER_AREA(B13,B10,B15,B16,B17,B18)
A21: "Estimated cost ($):"          B21: =HEAT_EXCHANGER_COST_ESTIMATE(B20,"stainless_steel",10)
```

#### Results Analysis
```excel
A23: "Performance Analysis"
A24: "Heat duty:"                   B24: =B13/1000 & " kW"
A25: "Water flow required:"         B25: =B14 & " kg/s"
A26: "LMTD:"                       B26: =B19 & " K"
A27: "Heat transfer area:"         B27: =B20 & " m²"
A28: "Estimated cost:"             B28: ="$" & B21
```

**Expected Results:**
- Heat duty: 420 kW
- Water flow: 5.0 kg/s
- LMTD: 42.4 K
- Required area: 33.0 m²
- Cost: ~$206,250

## Example 2: Air-Cooled Heat Exchanger

### Problem Statement
Design an air-cooled heat exchanger for a chemical process. Cool 2 kg/s of chemical solution from 90°C to 60°C using ambient air at 35°C.

### Solution in Excel

#### Input Parameters
```excel
A1: "Air-Cooled Heat Exchanger Design"
A3: "Process Conditions"
A4: "Solution flow (kg/s):"          B4: 2
A5: "Solution inlet (°C):"           B5: 90
A6: "Solution outlet (°C):"          B6: 60
A7: "Solution cp (J/kg·K):"          B7: 3200
A8: "Air inlet (°C):"                B8: 35
A9: "Air outlet (°C):"               B9: 65
A10: "Overall U (W/m²·K):"           B10: 45
A11: "Air density (kg/m³):"          B11: 1.1
A12: "Air cp (J/kg·K):"              B12: 1010
```

#### Heat Transfer Analysis
```excel
A14: "Thermal Analysis"
A15: "Heat duty (W):"               B15: =HEAT_DUTY_REQUIRED(B4,B7,B5-B6)
A16: "Air flow required (kg/s):"    B16: =B15/(B12*(B9-B8))
A17: "Hot fluid temp (K):"          B17: =CELSIUS_TO_KELVIN(B5) & " to " & CELSIUS_TO_KELVIN(B6)
A18: "Cold fluid temp (K):"         B18: =CELSIUS_TO_KELVIN(B8) & " to " & CELSIUS_TO_KELVIN(B9)
A19: "LMTD (K):"                    B19: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B8),CELSIUS_TO_KELVIN(B9),"crossflow")
A20: "Required area (m²):"          B20: =B15/(B10*B19)
A21: "Air velocity (m/s):"          B21: =B16/(B11*B20*0.5)  ' Assuming 50% free area
```

#### Equipment Sizing
```excel
A23: "Equipment Sizing"
A24: "Fin tube area (m²):"          B24: =B20
A25: "Fan air flow (m³/s):"         B25: =B16/B11
A26: "Fan power estimate (kW):"     B26: =B25*500/(0.7*1000)  ' 500 Pa pressure drop, 70% efficiency
A27: "Total cost estimate ($):"     B27: =B24*800+B26*2000   ' $800/m² + $2000/kW fan
```

## Example 3: Plate Heat Exchanger Selection

### Problem Statement
Select a plate heat exchanger for HVAC application. Heat 3 kg/s of water from 60°C to 80°C using hot water available at 95°C.

### Solution in Excel

#### System Analysis
```excel
A1: "Plate Heat Exchanger - HVAC Application"
A3: "System Requirements"
A4: "Cold water flow (kg/s):"       B4: 3
A5: "Cold water in (°C):"           B5: 60
A6: "Cold water out (°C):"          B6: 80
A7: "Hot water in (°C):"            B7: 95
A8: "Overall U (W/m²·K):"           B8: 3000  ' High for plate HX

' Calculate hot water requirements
A10: "Hot Water Requirements"
A11: "Heat duty (W):"               B11: =HEAT_DUTY_REQUIRED(B4,4180,B6-B5)
A12: "Hot water temp drop (K):"     B12: 25   ' Assumed
A13: "Hot water outlet (°C):"       B13: =B7-B12
A14: "Hot water flow (kg/s):"       B14: =B11/(4180*B12)

' Heat exchanger sizing
A16: "Heat Exchanger Sizing"
A17: "LMTD (K):"                    B17: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B7),CELSIUS_TO_KELVIN(B13),CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B6))
A18: "Required area (m²):"          B18: =B11/(B8*B17)
A19: "Number of plates:"            B19: =B18/0.3  ' 0.3 m² per plate typical
A20: "Plate HX cost ($):"           B20: =B19*150  ' $150 per plate
```

#### Performance Validation
```excel
A22: "Performance Validation"
A23: "Approach temp (K):"           B23: =MIN(B7-B6, B13-B5)
A24: "Effectiveness:"               B24: =ENGIVAULT_EFFECTIVENESS(NTU_FROM_AREA(B18,B8,MIN(B4*4180,B14*4180)),MIN(B4*4180,B14*4180)/MAX(B4*4180,B14*4180),"counterflow")
A25: "Design rating:"               B25: =VALIDATE_HEAT_EXCHANGER(B24,0,2,2)
```

## Example 4: Heat Recovery System

### Problem Statement
Design a heat recovery system to preheat incoming cold water using hot wastewater. Maximize energy recovery while staying within budget constraints.

### Solution in Excel

#### Energy Recovery Analysis
```excel
A1: "Heat Recovery System Design"
A3: "Waste Heat Source"
A4: "Hot water flow (kg/s):"        B4: 8
A5: "Hot water temp (°C):"          B5: 75
A6: "Min hot water temp (°C):"      B6: 45  ' Process constraint
A7: "Cold water flow (kg/s):"       B7: 6
A8: "Cold water in (°C):"           B8: 15
A9: "Max cold water temp (°C):"     B9: 55  ' Process constraint

' Heat recovery potential
A11: "Recovery Analysis"
A12: "Max heat available (W):"      B12: =HEAT_DUTY_REQUIRED(B4,4180,B5-B6)
A13: "Max heat recoverable (W):"    B13: =HEAT_DUTY_REQUIRED(B7,4180,B9-B8)
A14: "Actual heat recovery (W):"    B14: =MIN(B12,B13)
A15: "Hot water outlet (°C):"       B15: =B5-B14/(B4*4180)
A16: "Cold water outlet (°C):"      B16: =B8+B14/(B7*4180)
```

#### Heat Exchanger Design
```excel
A18: "Heat Exchanger Design"
A19: "LMTD (K):"                    B19: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B15),CELSIUS_TO_KELVIN(B8),CELSIUS_TO_KELVIN(B16))
A20: "Overall U (W/m²·K):"          B20: 1500  ' Plate heat exchanger
A21: "Required area (m²):"          B21: =B14/(B20*B19)
A22: "Equipment cost ($):"          B22: =HEAT_EXCHANGER_COST_ESTIMATE(B21,"stainless_steel",5)

' Economic analysis
A24: "Economic Analysis"
A25: "Energy saved (kW):"           B25: =B14/1000
A26: "Annual savings ($/year):"     B26: =B25*8760*0.08  ' $0.08/kWh, 8760 hours/year
A27: "Payback period (years):"      B27: =B22/B26
A28: "NPV (10 years, 8%):"          B28: =B26*((1-(1.08)^-10)/0.08)-B22
```

## Example 5: Multi-Pass Heat Exchanger

### Problem Statement
Design a 2-pass shell-and-tube heat exchanger with specific constraints on tube velocity and pressure drop.

### Solution in Excel

#### Multi-Pass Analysis
```excel
A1: "2-Pass Shell-and-Tube Heat Exchanger"
A3: "Design Parameters"
A4: "Number of passes:"             B4: 2
A5: "Tube diameter (m):"            B5: 0.02
A6: "Tube length (m):"              B6: 4
A7: "Max tube velocity (m/s):"      B7: 2.5
A8: "Shell fluid:"                  B8: "Hot oil"
A9: "Tube fluid:"                   B9: "Cooling water"

' Flow analysis per pass
A11: "Flow Analysis"
A12: "Water flow per pass (kg/s):"  B12: =Total_Water_Flow/B4
A13: "Tubes per pass:"              B13: =B12/(WATER_DENSITY(30)*B7*ENGIVAULT_PIPE_AREA(B5))
A14: "Total tubes:"                 B14: =B13*B4
A15: "Shell diameter (m):"          B15: =SQRT(B14*B5^2/0.785)*1.2  ' 20% clearance

' Heat transfer per pass
A17: "Heat Transfer per Pass"
A18: "Heat duty per pass (W):"      B18: =Total_Heat_Duty/B4
A19: "LMTD per pass (K):"           B19: =ENGIVAULT_LMTD(T_oil_in,T_oil_mid,T_water_in,T_water_out)
A20: "Area per pass (m²):"          B20: =B18/(Overall_U*B19)
A21: "Total area (m²):"             B21: =B20*B4
```

## Example 6: Heat Exchanger Network

### Problem Statement
Design a heat exchanger network for a process with multiple hot and cold streams.

### Solution in Excel

#### Stream Data
| Stream | Type | Flow (kg/s) | Inlet (°C) | Outlet (°C) | Cp (J/kg·K) | Heat Load (kW) |
|--------|------|-------------|------------|-------------|-------------|----------------|
| H1 | Hot | 2.5 | 150 | 80 | 2200 | =HEAT_DUTY_REQUIRED(B2,E2,C2-D2)/1000 |
| H2 | Hot | 1.8 | 120 | 60 | 2400 | =HEAT_DUTY_REQUIRED(B3,E3,C3-D3)/1000 |
| C1 | Cold | 3.0 | 40 | 90 | 4180 | =HEAT_DUTY_REQUIRED(B4,E4,D4-C4)/1000 |
| C2 | Cold | 2.2 | 25 | 75 | 3800 | =HEAT_DUTY_REQUIRED(B5,E5,D5-C5)/1000 |

#### Heat Exchanger Matching
```excel
A8: "Heat Exchanger Network Design"
A9: "HX-1: H1 vs C1"
A10: "Heat duty (kW):"              B10: =MIN(F2,F4)
A11: "H1 outlet (°C):"              B11: =C2-B10*1000/(B2*E2)
A12: "C1 outlet (°C):"              B12: =C4+B10*1000/(B4*E4)
A13: "LMTD (K):"                    B13: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(C2),CELSIUS_TO_KELVIN(B11),CELSIUS_TO_KELVIN(C4),CELSIUS_TO_KELVIN(B12))
A14: "Area required (m²):"          B14: =B10*1000/(800*B13)
```

## Example 7: Condenser Design

### Problem Statement
Design a condenser for a steam turbine. Condense 15 kg/s of steam at 0.1 bar (45.8°C) using cooling water from 20°C to 35°C.

### Solution in Excel

#### Steam Condensation Analysis
```excel
A1: "Steam Condenser Design"
A3: "Steam Conditions"
A4: "Steam flow (kg/s):"            B4: 15
A5: "Steam pressure (bar):"         B5: 0.1
A6: "Saturation temp (°C):"         B6: 45.8
A7: "Latent heat (kJ/kg):"          B7: 2392
A8: "Cooling water in (°C):"        B8: 20
A9: "Cooling water out (°C):"       B9: 35

' Condenser calculations
A11: "Condenser Analysis"
A12: "Heat duty (MW):"              B12: =B4*B7/1000
A13: "Cooling water flow (kg/s):"   B13: =B12*1000000/(4180*(B9-B8))
A14: "LMTD (K):"                    B14: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B8),CELSIUS_TO_KELVIN(B9))
A15: "Overall U (W/m²·K):"          B15: 2500  ' Steam condensation
A16: "Area required (m²):"          B16: =B12*1000000/(B15*B14)
A17: "Tube length (m):"             B17: 8
A18: "Tube diameter (m):"           B18: 0.025
A19: "Number of tubes:"             B19: =B16/(3.14159*B18*B17)
```

#### Performance Validation
```excel
A21: "Performance Check"
A22: "Water velocity (m/s):"        B22: =B13/(WATER_DENSITY(27.5)*B19*ENGIVAULT_PIPE_AREA(B18))
A23: "Velocity status:"             B23: =VALIDATE_VELOCITY(B22,"water")
A24: "Approach temp (K):"           B24: =B6-B9
A25: "Design margin:"               B25: =IF(B24>5,"✓ Adequate","⚠ Low approach")
```

## Example 8: Heat Pump Evaporator

### Problem Statement
Size the evaporator for a heat pump system. Evaporate refrigerant at 5°C using glycol solution cooled from 12°C to 7°C.

### Solution in Excel

#### Heat Pump Analysis
```excel
A1: "Heat Pump Evaporator Design"
A3: "Operating Conditions"
A4: "Refrigerant temp (°C):"        B4: 5
A5: "Glycol inlet (°C):"            B5: 12
A6: "Glycol outlet (°C):"           B6: 7
A7: "Glycol flow (kg/s):"           B7: 8
A8: "Glycol cp (J/kg·K):"           B8: 3800
A9: "Overall U (W/m²·K):"           B9: 800

' Evaporator sizing
A11: "Evaporator Sizing"
A12: "Heat duty (W):"               B12: =HEAT_DUTY_REQUIRED(B7,B8,B5-B6)
A13: "LMTD (K):"                    B13: =ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B4),CELSIUS_TO_KELVIN(B4))
A14: "Area required (m²):"          B14: =B12/(B9*B13)
A15: "Plate count:"                 B15: =B14/0.5  ' 0.5 m² per plate
A16: "Evaporator cost ($):"         B16: =B15*200  ' $200 per plate
```

## Example 9: Effectiveness-NTU Design Method

### Problem Statement
Use the effectiveness-NTU method to design a crossflow heat exchanger for gas turbine applications.

### Solution in Excel

#### NTU Method Analysis
```excel
A1: "Gas Turbine Heat Recovery - NTU Method"
A3: "Gas Turbine Conditions"
A4: "Exhaust gas flow (kg/s):"      B4: 25
A5: "Exhaust gas temp (°C):"        B5: 450
A6: "Gas cp (J/kg·K):"              B6: 1150
A7: "Air flow (kg/s):"              B7: 20
A8: "Air inlet temp (°C):"          B8: 25
A9: "Air cp (J/kg·K):"              B9: 1010

' Capacity rate analysis
A11: "Capacity Rate Analysis"
A12: "Gas capacity rate (W/K):"     B12: =CAPACITY_RATE(B4,B6)
A13: "Air capacity rate (W/K):"     B13: =CAPACITY_RATE(B7,B9)
A14: "Min capacity rate (W/K):"     B14: =MIN(B12,B13)
A15: "Max capacity rate (W/K):"     B15: =MAX(B12,B13)
A16: "Capacity ratio:"              B16: =B14/B15

' NTU design
A18: "NTU Design"
A19: "Target effectiveness:"        B19: 0.7
A20: "Required NTU:"                B20: =SOLVER_NTU(B19,B16,"crossflow")  ' Use Goal Seek
A21: "Overall U (W/m²·K):"          B21: 65   ' Gas-air crossflow
A22: "Required area (m²):"          B22: =B20*B14/B21
A23: "Air outlet temp (°C):"        B23: =B8+B19*(B5-B8)*B16
```

## Example 10: Thermal Resistance Analysis

### Problem Statement
Analyze thermal resistance through a composite wall with convection on both sides.

### Solution in Excel

#### Composite Wall Analysis
```excel
A1: "Thermal Resistance Analysis - Composite Wall"
A3: "Wall Construction"
A4: "Layer 1 - Concrete:"
A5: "  Thickness (m):"              B5: 0.2
A6: "  Thermal cond. (W/m·K):"      B6: 1.4
A7: "Layer 2 - Insulation:"
A8: "  Thickness (m):"              B8: 0.05
A9: "  Thermal cond. (W/m·K):"      B9: 0.04
A10: "Layer 3 - Steel:"
A11: "  Thickness (m):"             B11: 0.01
A12: "  Thermal cond. (W/m·K):"     B12: 50

' Convection conditions
A14: "Convection Conditions"
A15: "Inside HTC (W/m²·K):"         B15: 25    ' Natural convection
A16: "Outside HTC (W/m²·K):"        B16: 100   ' Forced convection
A17: "Wall area (m²):"              B17: 10

' Resistance calculations
A19: "Thermal Resistance Analysis"
A20: "R_conv_inside (K/W):"         B20: =1/(B15*B17)
A21: "R_cond_concrete (K/W):"       B21: =B5/(B6*B17)
A22: "R_cond_insulation (K/W):"     B22: =B8/(B9*B17)
A23: "R_cond_steel (K/W):"          B23: =B11/(B12*B17)
A24: "R_conv_outside (K/W):"        B24: =1/(B16*B17)
A25: "Total resistance (K/W):"      B25: =SUM(B20:B24)
A26: "Heat transfer rate (W/K):"    B26: =1/B25
A27: "Heat flux for 50K ΔT (W/m²):" B27: =50/B25/B17
```

## Tips for Effective Use

### 1. **Start with Energy Balance**
Always verify that heat gained by cold fluid equals heat lost by hot fluid:
```excel
=HEAT_DUTY_REQUIRED(m_hot, cp_hot, T_hot_drop)
=HEAT_DUTY_REQUIRED(m_cold, cp_cold, T_cold_rise)
```

### 2. **Use Appropriate Flow Arrangements**
- **Counterflow**: Maximum effectiveness
- **Parallel**: Easier temperature control
- **Crossflow**: Compact design

### 3. **Validate Design Parameters**
```excel
=VALIDATE_HEAT_EXCHANGER(effectiveness, 0, v_hot, v_cold)
```

### 4. **Consider Economic Optimization**
```excel
' Total cost = Capital cost + Operating cost
=Equipment_Cost + Annual_Operating_Cost * Present_Worth_Factor
```

### 5. **Check Physical Constraints**
- Approach temperatures > 5K
- Reasonable velocities (1-3 m/s for liquids)
- Pressure drop limitations
- Material temperature limits

**🌡️ These examples demonstrate the power of EngiVault's heat transfer functions for real-world thermal system design and analysis!**
