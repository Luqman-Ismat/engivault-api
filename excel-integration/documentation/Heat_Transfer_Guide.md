# EngiVault Heat Transfer Module - Complete Guide

## Overview

The EngiVault Heat Transfer Module provides comprehensive thermal analysis capabilities for engineers working with heat exchangers, thermal systems, and heat transfer equipment. This module extends EngiVault's capabilities beyond hydraulics into the thermal domain.

## 🌡️ **Available Calculations**

### **Core Heat Transfer Functions**

#### **1. Log Mean Temperature Difference (LMTD)**
```excel
=ENGIVAULT_LMTD(hot_in, hot_out, cold_in, cold_out, [flow_arrangement])
```
- **Purpose**: Calculate LMTD for heat exchanger sizing
- **Applications**: Shell-and-tube, plate heat exchangers
- **Flow arrangements**: Counterflow, parallel flow

#### **2. Heat Exchanger Area Sizing**
```excel
=ENGIVAULT_HEAT_EXCHANGER_AREA(heat_duty, overall_u, hot_in, hot_out, cold_in, cold_out, [flow_arrangement])
```
- **Purpose**: Calculate required heat transfer area
- **Applications**: Heat exchanger design and selection
- **Method**: LMTD approach with effectiveness calculation

#### **3. Effectiveness-NTU Method**
```excel
=ENGIVAULT_EFFECTIVENESS(ntu, capacity_ratio, flow_arrangement)
```
- **Purpose**: Calculate heat exchanger effectiveness
- **Applications**: Performance analysis, rating calculations
- **Arrangements**: Counterflow, parallel, crossflow

### **Thermal Properties Functions**

#### **Water Properties at Temperature**
```excel
=THERMAL_CONDUCTIVITY_WATER(temperature)  ' W/m·K
=SPECIFIC_HEAT_WATER(temperature)          ' J/kg·K  
=PRANDTL_NUMBER_WATER(temperature)         ' dimensionless
```

#### **Heat Transfer Coefficients**
```excel
=NUSSELT_FLAT_PLATE(reynolds, prandtl)     ' Flat plate
=NUSSELT_TUBE_INTERNAL(reynolds, prandtl)  ' Tube internal flow
=HEAT_TRANSFER_COEFFICIENT(nusselt, k, length) ' From Nusselt number
```

### **Design and Analysis Functions**

#### **Heat Duty Calculations**
```excel
=HEAT_DUTY_REQUIRED(mass_flow, specific_heat, temp_change)
=NTU_FROM_AREA(area, overall_u, min_capacity_rate)
=CAPACITY_RATE(mass_flow, specific_heat)
```

#### **Temperature Conversions**
```excel
=CELSIUS_TO_KELVIN(celsius)
=KELVIN_TO_CELSIUS(kelvin)
=FAHRENHEIT_TO_CELSIUS(fahrenheit)
=CELSIUS_TO_FAHRENHEIT(celsius)
```

#### **Validation Functions**
```excel
=VALIDATE_HEAT_EXCHANGER(effectiveness, npsh_margin, v_hot, v_cold)
```

#### **Economic Analysis**
```excel
=HEAT_EXCHANGER_COST_ESTIMATE(area, material, [pressure])
```

## 🏭 **Real-World Applications**

### **Application 1: Process Cooling System**

**Scenario**: Cool process fluid from 120°C to 70°C using cooling water (25°C → 45°C)

```excel
' Design parameters
Heat_Duty:     =HEAT_DUTY_REQUIRED(5, 2500, 50)  ' 625 kW
Hot_In_K:      =CELSIUS_TO_KELVIN(120)           ' 393.15 K
Hot_Out_K:     =CELSIUS_TO_KELVIN(70)            ' 343.15 K
Cold_In_K:     =CELSIUS_TO_KELVIN(25)            ' 298.15 K
Cold_Out_K:    =CELSIUS_TO_KELVIN(45)            ' 318.15 K

' Heat exchanger analysis
LMTD:          =ENGIVAULT_LMTD(B6,B7,B8,B9,"counterflow")
Area_Required: =ENGIVAULT_HEAT_EXCHANGER_AREA(B3,800,B6,B7,B8,B9)
Cost_Estimate: =HEAT_EXCHANGER_COST_ESTIMATE(B11,"stainless_steel",15)
```

### **Application 2: Steam Condenser Design**

**Scenario**: Design condenser for steam turbine

```excel
' Steam conditions
Steam_Temp:    =CELSIUS_TO_KELVIN(40)    ' 40°C (vacuum condenser)
Cooling_In:    =CELSIUS_TO_KELVIN(20)    ' Cooling water inlet
Cooling_Out:   =CELSIUS_TO_KELVIN(35)    ' Cooling water outlet
Latent_Heat:   2406000                   ' J/kg at 40°C
Steam_Flow:    25                        ' kg/s

' Condenser sizing
Heat_Duty:     =B5*B6                    ' Total heat rejection
LMTD:          =ENGIVAULT_LMTD(B2,B2,B3,B4,"counterflow")  ' Steam temp constant
Area:          =B7/(1200*B8)             ' U=1200 for steam condensation
Tubes_Required: =B9/(3.14159*0.025*6)   ' 25mm tubes, 6m long
```

### **Application 3: Air-Cooled Heat Exchanger**

**Scenario**: Cool oil using ambient air

```excel
' Operating conditions
Oil_In:        =CELSIUS_TO_KELVIN(80)
Oil_Out:       =CELSIUS_TO_KELVIN(50)
Air_In:        =CELSIUS_TO_KELVIN(35)    ' Hot summer day
Air_Out:       =CELSIUS_TO_KELVIN(55)
Overall_U:     45                        ' W/m²·K (air-oil)

' Design analysis
LMTD:          =ENGIVAULT_LMTD(B2,B3,B4,B5,"crossflow")
Area:          =ENGIVAULT_HEAT_EXCHANGER_AREA(Heat_Duty,B6,B2,B3,B4,B5)
Fan_Power:     =Air_Flow * Pressure_Drop / (Fan_Efficiency * 1000)
```

## 📊 **Advanced Analysis Techniques**

### **Sensitivity Analysis**
Create parameter sweep tables:

| Overall U | Area (m²) | Cost ($) | Effectiveness | Notes |
|-----------|-----------|----------|---------------|-------|
| 200 | =HX_AREA(Q,A2,T1,T2,T3,T4) | =COST_EST(B2,"SS") | =EFFECTIVENESS(...) | Low U |
| 500 | =HX_AREA(Q,A3,T1,T2,T3,T4) | =COST_EST(B3,"SS") | =EFFECTIVENESS(...) | Medium U |
| 1000 | =HX_AREA(Q,A4,T1,T2,T3,T4) | =COST_EST(B4,"SS") | =EFFECTIVENESS(...) | High U |

### **Optimization Analysis**
```excel
' Find optimal design point
Min_Cost:      =MIN(Cost_Range)
Optimal_U:     =INDEX(U_Range, MATCH(B2, Cost_Range, 0))
Optimal_Area:  =INDEX(Area_Range, MATCH(B2, Cost_Range, 0))
```

### **Performance Mapping**
```excel
' Create performance map
Flow_Rate_Range:  {0.5, 1.0, 1.5, 2.0, 2.5} kg/s
Heat_Duty_Matrix: =HEAT_DUTY_REQUIRED(Flow_Range, cp, delta_T)
Area_Matrix:      =ENGIVAULT_HEAT_EXCHANGER_AREA(Heat_Matrix, U, ...)
```

## 🔬 **Technical Correlations Used**

### **LMTD Calculation**
- **Counterflow**: ΔT₁ = T_h,in - T_c,out, ΔT₂ = T_h,out - T_c,in
- **Parallel flow**: ΔT₁ = T_h,in - T_c,in, ΔT₂ = T_h,out - T_c,out
- **LMTD**: (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)

### **Effectiveness-NTU Relations**
- **Counterflow**: ε = (1-exp(-NTU(1-C*)))/(1-C*exp(-NTU(1-C*)))
- **Parallel flow**: ε = (1-exp(-NTU(1+C*)))/(1+C*)
- **Crossflow**: Various correlations based on mixing

### **Nusselt Number Correlations**
- **Flat plate (laminar)**: Nu = 0.332 Re^0.5 Pr^(1/3)
- **Flat plate (turbulent)**: Nu = 0.0296 Re^0.8 Pr^(1/3)
- **Tube internal (laminar)**: Nu = 3.66 (fully developed)
- **Tube internal (turbulent)**: Nu = 0.023 Re^0.8 Pr^0.4

## ⚠️ **Important Design Considerations**

### **Temperature Constraints**
- **Approach temperature**: Minimum 5-10K for economic design
- **Temperature cross**: Not physically possible in single-pass
- **Material limits**: Check maximum operating temperatures

### **Flow Arrangement Selection**
- **Counterflow**: Highest effectiveness, most efficient
- **Parallel flow**: Lower effectiveness, easier to control
- **Crossflow**: Moderate effectiveness, compact design

### **Fouling Considerations**
- **Fouling factors**: Reduce overall U over time
- **Cleaning access**: Design for maintenance
- **Material selection**: Corrosion and fouling resistance

### **Economic Optimization**
- **Capital cost**: Increases with area and material grade
- **Operating cost**: Pumping power, maintenance
- **Total cost**: Life cycle cost analysis

## 🎯 **Best Practices**

### **Design Process**
1. **Define requirements**: Heat duty, temperatures, fluids
2. **Select flow arrangement**: Based on efficiency needs
3. **Estimate overall U**: From literature or experience
4. **Calculate area**: Using LMTD or effectiveness-NTU
5. **Validate design**: Check approach temperatures, velocities
6. **Optimize**: Balance area vs. cost
7. **Select standard size**: Choose commercial equipment

### **Excel Implementation**
1. **Use named ranges**: For key parameters
2. **Add data validation**: Prevent invalid inputs
3. **Include error handling**: Use IFERROR for API functions
4. **Create charts**: Visualize performance and costs
5. **Document assumptions**: Note design basis

### **Verification Methods**
1. **Energy balance**: Verify Q_hot = Q_cold
2. **Sanity checks**: Compare with known designs
3. **Literature comparison**: Check against textbook examples
4. **Vendor data**: Validate with manufacturer curves

---

**📚 The Heat Transfer Module transforms EngiVault into a comprehensive thermal analysis platform, enabling engineers to design and analyze heat transfer equipment with the same ease as hydraulic calculations.**
