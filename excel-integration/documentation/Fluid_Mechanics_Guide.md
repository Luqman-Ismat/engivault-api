# EngiVault Fluid Mechanics Module - Complete Guide

## Overview

The EngiVault Fluid Mechanics Module provides advanced fluid flow analysis capabilities covering open channel flow, compressible flow, boundary layer analysis, and external flow over objects. This module completes EngiVault's comprehensive flow analysis platform.

## 💨 **Available Calculations**

### **Open Channel Flow (Manning's Equation)**

#### **Core Functions**
```excel
=ENGIVAULT_MANNING_FLOW(flow_rate, width, slope, manning_n, [shape], [side_slope])
=ENGIVAULT_CRITICAL_DEPTH(flow_rate, width, [shape], [side_slope])
=ENGIVAULT_FROUDE_NUMBER(velocity, hydraulic_depth)
```

#### **Applications**
- **Civil Engineering**: River design, drainage systems, irrigation canals
- **Environmental**: Stormwater management, flood analysis
- **Water Resources**: Channel design, flow capacity analysis

### **Compressible Flow (Gas Dynamics)**

#### **Core Functions**
```excel
=ENGIVAULT_MACH_NUMBER(velocity, temperature, [gamma], [gas_constant])
=ENGIVAULT_SPEED_OF_SOUND(temperature, [gamma], [gas_constant])
=ENGIVAULT_STAGNATION_PRESSURE(static_pressure, mach_number, [gamma])
=ENGIVAULT_STAGNATION_TEMPERATURE(static_temperature, mach_number, [gamma])
```

#### **Applications**
- **Aerospace**: Aircraft design, engine analysis, wind tunnel testing
- **Mechanical**: Gas turbines, compressors, nozzles
- **Process**: High-pressure gas systems, pneumatic transport

### **Boundary Layer Analysis**

#### **Core Functions**
```excel
=ENGIVAULT_BOUNDARY_LAYER_THICKNESS(reynolds_number, distance, [flow_regime])
=ENGIVAULT_SKIN_FRICTION(reynolds_number, [flow_regime])
```

#### **Applications**
- **Aerodynamics**: Aircraft drag analysis, wing design
- **Heat Transfer**: Convection coefficient calculations
- **Marine**: Ship hull design, submarine analysis

### **External Flow**

#### **Core Functions**
```excel
=ENGIVAULT_DRAG_COEFFICIENT(reynolds_number, geometry)
=ENGIVAULT_DRAG_FORCE(drag_coefficient, density, velocity, frontal_area)
```

#### **Applications**
- **Automotive**: Vehicle aerodynamics, fuel efficiency
- **Sports**: Ball trajectory, equipment design
- **Industrial**: Particle settling, flow measurement

### **Shock Wave Analysis**

#### **Core Functions**
```excel
=ENGIVAULT_NORMAL_SHOCK_PRESSURE(mach_1, [gamma])
=ENGIVAULT_NORMAL_SHOCK_MACH(mach_1, [gamma])
```

#### **Applications**
- **Supersonic Flight**: Shock wave analysis, inlet design
- **Explosion Analysis**: Blast wave calculations
- **Gas Dynamics**: Nozzle design, wind tunnel testing

### **Validation and Utilities**

#### **Core Functions**
```excel
=VALIDATE_OPEN_CHANNEL_FLOW(froude_number, velocity, depth)
=VALIDATE_COMPRESSIBLE_FLOW(mach_number, temperature, pressure)
=HYDRAULIC_DIAMETER(area, wetted_perimeter)
=DYNAMIC_PRESSURE(density, velocity)
```

## 🌊 **Real-World Applications**

### **Application 1: Storm Drain Design**

**Problem**: Size a rectangular storm drain for 2.5 m³/s peak flow with 0.5% slope.

```excel
' Design parameters
Flow_Rate:     2.5          ' m³/s
Channel_Slope: 0.005        ' 0.5%
Manning_n:     0.013        ' Concrete
Max_Velocity:  3.0          ' m/s (erosion limit)

' Try different widths
Width_Options: {1.5, 2.0, 2.5, 3.0} m

' Analysis for each width
Normal_Depth:  =ENGIVAULT_MANNING_FLOW(B2,A6,B3,B4,"rectangular")
Velocity:      =B2/(A6*B6)
Froude:        =ENGIVAULT_FROUDE_NUMBER(B7,B6)
Flow_Regime:   =IF(B8<1,"Subcritical","Supercritical")
Validation:    =VALIDATE_OPEN_CHANNEL_FLOW(B8,B7,B6)
```

**Results Table:**
| Width (m) | Depth (m) | Velocity (m/s) | Froude | Regime | Status |
|-----------|-----------|----------------|--------|--------|--------|
| 1.5 | 1.89 | 0.88 | 0.20 | Subcritical | Good |
| 2.0 | 1.58 | 0.79 | 0.20 | Subcritical | Excellent |
| 2.5 | 1.37 | 0.73 | 0.20 | Subcritical | Excellent |

### **Application 2: Gas Pipeline Analysis**

**Problem**: Analyze natural gas flow in pipeline at various pressures and temperatures.

```excel
' Gas properties (Natural Gas)
Gamma:         1.3
Gas_Constant:  518          ' J/kg·K
Mol_Weight:    16.04        ' kg/kmol

' Operating conditions
Temperature:   288          ' K (15°C)
Pressure:      5000000      ' Pa (50 bar)
Velocity:      15           ' m/s

' Compressible flow analysis
Mach_Number:   =ENGIVAULT_MACH_NUMBER(B7,B5,B2,B3)
Speed_Sound:   =ENGIVAULT_SPEED_OF_SOUND(B5,B2,B3)
Stag_Pressure: =ENGIVAULT_STAGNATION_PRESSURE(B6,B8,B2)
Stag_Temp:     =ENGIVAULT_STAGNATION_TEMPERATURE(B5,B8,B2)
Flow_Regime:   =VALIDATE_COMPRESSIBLE_FLOW(B8,B5,B6)
```

### **Application 3: Aircraft Wing Analysis**

**Problem**: Calculate drag on aircraft wing section.

```excel
' Flight conditions
Altitude:      10000        ' m
Air_Density:   0.414        ' kg/m³ at 10km
Air_Viscosity: 1.46E-05     ' Pa·s at -50°C
Velocity:      250          ' m/s (cruise speed)
Chord_Length:  2.5          ' m (wing chord)

' Boundary layer analysis
Reynolds:      =Velocity*Chord_Length*Air_Density/Air_Viscosity
BL_Thickness:  =ENGIVAULT_BOUNDARY_LAYER_THICKNESS(B7,B6,"turbulent")
Skin_Friction: =ENGIVAULT_SKIN_FRICTION(B7,"turbulent")
Drag_Coeff:    =ENGIVAULT_DRAG_COEFFICIENT(B7,"flat_plate")
Drag_Force:    =ENGIVAULT_DRAG_FORCE(B10,B3,B5,B6*1)  ' Per unit span
```

### **Application 4: Supersonic Nozzle Design**

**Problem**: Design convergent-divergent nozzle for supersonic flow.

```excel
' Inlet conditions
Stag_Pressure: 500000       ' Pa (5 bar)
Stag_Temp:     600          ' K (327°C)
Gamma:         1.33         ' Hot gas
Gas_Constant:  287          ' J/kg·K

' Critical conditions (throat)
Crit_Pressure: =B2*(2/(B5+1))^(B5/(B5-1))
Crit_Temp:     =B3*2/(B5+1)
Crit_Velocity: =ENGIVAULT_SPEED_OF_SOUND(B8,B5,B6)
Crit_Density:  =B7/(B6*B8)

' Exit conditions (supersonic)
Exit_Mach:     2.5
Exit_Pressure: =B7*((1+(B5-1)/2*B11^2)^(B5/(B5-1)))^-1
Exit_Temp:     =B8/(1+(B5-1)/2*B11^2)
Area_Ratio:    =((B5+1)/2)^((B5+1)/(2*(B5-1)))/B11*((1+(B5-1)/2*B11^2)^((B5+1)/(2*(B5-1))))
```

## 🔬 **Technical Correlations Used**

### **Manning's Equation for Open Channels**
```
Q = (1/n) × A × R^(2/3) × S^(1/2)
```
Where:
- Q = Flow rate (m³/s)
- n = Manning's roughness coefficient
- A = Cross-sectional area (m²)
- R = Hydraulic radius (m)
- S = Channel slope

### **Isentropic Flow Relations**
```
T₀/T = 1 + ((γ-1)/2) × M²
p₀/p = (1 + ((γ-1)/2) × M²)^(γ/(γ-1))
ρ₀/ρ = (1 + ((γ-1)/2) × M²)^(1/(γ-1))
```

### **Boundary Layer (Blasius Solution)**
```
δ/x = 5.0/√(Re_x)  (laminar)
δ/x = 0.37/(Re_x)^0.2  (turbulent)
```

### **Normal Shock Relations**
```
p₂/p₁ = (2γM₁² - (γ-1))/(γ+1)
M₂² = (M₁² + 2/(γ-1))/(2γM₁²/(γ-1) - 1)
```

## 📊 **Practical Examples**

### **Example 1: Irrigation Canal Design**
```excel
A1: "Irrigation Canal Design"
A3: "Design Parameters"
A4: "Required flow (m³/s):"     B4: 3.5
A5: "Available slope:"          B5: 0.0008
A6: "Manning's n (earth):"      B6: 0.025
A7: "Max velocity (m/s):"       B7: 1.5

A9: "Channel Analysis"
A10: "Trial width (m):"         B10: 4.0
A11: "Normal depth (m):"        B11: =ENGIVAULT_MANNING_FLOW(B4,B10,B5,B6)
A12: "Velocity (m/s):"          B12: =B4/(B10*B11)
A13: "Froude number:"           B13: =ENGIVAULT_FROUDE_NUMBER(B12,B11)
A14: "Flow regime:"             B14: =IF(B13<1,"Subcritical","Supercritical")
A15: "Design status:"           B15: =IF(B12<B7,"✓ Acceptable","⚠ Too fast")
```

### **Example 2: Gas Turbine Analysis**
```excel
A1: "Gas Turbine Compressible Flow Analysis"
A3: "Operating Conditions"
A4: "Inlet temperature (K):"    B4: 288
A5: "Inlet pressure (Pa):"      B5: 101325
A6: "Velocity (m/s):"           B6: 150
A7: "Gamma (hot gas):"          B7: 1.33

A9: "Flow Analysis"
A10: "Mach number:"             B10: =ENGIVAULT_MACH_NUMBER(B6,B4,B7,287)
A11: "Speed of sound (m/s):"    B11: =ENGIVAULT_SPEED_OF_SOUND(B4,B7,287)
A12: "Stagnation pressure:"     B12: =ENGIVAULT_STAGNATION_PRESSURE(B5,B10,B7)
A13: "Stagnation temperature:"  B13: =ENGIVAULT_STAGNATION_TEMPERATURE(B4,B10,B7)
A14: "Flow regime:"             B14: =VALIDATE_COMPRESSIBLE_FLOW(B10,B4,B5)
```

### **Example 3: Aircraft Drag Analysis**
```excel
A1: "Aircraft Wing Drag Analysis"
A3: "Flight Conditions"
A4: "Altitude (m):"             B4: 11000
A5: "Air density (kg/m³):"      B5: 0.365
A6: "Air viscosity (Pa·s):"     B6: 1.42E-05
A7: "Velocity (m/s):"           B7: 230
A8: "Wing chord (m):"           B8: 3.0

A10: "Boundary Layer Analysis"
A11: "Reynolds number:"         B11: =B7*B8*B5/B6
A12: "BL thickness (mm):"       B12: =ENGIVAULT_BOUNDARY_LAYER_THICKNESS(B11,B8,"turbulent")*1000
A13: "Skin friction coeff:"     B13: =ENGIVAULT_SKIN_FRICTION(B11,"turbulent")
A14: "Drag coefficient:"        B14: =ENGIVAULT_DRAG_COEFFICIENT(B11,"flat_plate")
A15: "Drag force per span (N/m):" B15: =ENGIVAULT_DRAG_FORCE(B14,B5,B7,B8)
```

## 🎯 **Design Guidelines**

### **Open Channel Flow**
- **Froude Number < 1**: Subcritical flow (stable, preferred)
- **Froude Number ≈ 1**: Critical flow (unstable, avoid)
- **Froude Number > 1**: Supercritical flow (high energy, erosion risk)

#### **Manning's Roughness Coefficients**
| Surface | Manning's n |
|---------|-------------|
| Smooth concrete | 0.012 |
| Rough concrete | 0.017 |
| Earth channel | 0.025 |
| Natural channel | 0.035 |
| Rocky channel | 0.040 |

### **Compressible Flow**
- **M < 0.3**: Incompressible approximation valid
- **0.3 < M < 1**: Compressible subsonic
- **M = 1**: Sonic (choked flow)
- **M > 1**: Supersonic (shock waves possible)

#### **Gas Properties**
| Gas | γ (Gamma) | R (J/kg·K) |
|-----|-----------|------------|
| Air | 1.40 | 287 |
| Steam | 1.33 | 462 |
| Natural Gas | 1.30 | 518 |
| Hydrogen | 1.41 | 4124 |
| Carbon Dioxide | 1.30 | 189 |

### **Boundary Layer**
- **Re < 5×10⁵**: Laminar boundary layer
- **Re > 10⁶**: Turbulent boundary layer
- **5×10⁵ < Re < 10⁶**: Transitional region

## 📋 **Excel Templates**

### **Open Channel Flow Template**
```excel
A1: "Open Channel Flow Design"
A3: "Input Parameters"
A4: "Flow rate (m³/s):"         B4: [User Input]
A5: "Channel width (m):"        B5: [User Input]
A6: "Channel slope:"            B6: [User Input]
A7: "Manning's n:"              B7: [User Input]
A8: "Channel shape:"            B8: "rectangular"

A10: "Flow Analysis"
A11: "Normal depth (m):"        B11: =ENGIVAULT_MANNING_FLOW(B4,B5,B6,B7,B8)
A12: "Critical depth (m):"      B12: =ENGIVAULT_CRITICAL_DEPTH(B4,B5,B8)
A13: "Velocity (m/s):"          B13: =B4/(B5*B11)
A14: "Froude number:"           B14: =ENGIVAULT_FROUDE_NUMBER(B13,B11)
A15: "Flow regime:"             B15: =IF(B14<1,"Subcritical",IF(B14>1.05,"Supercritical","Critical"))
A16: "Design validation:"       B16: =VALIDATE_OPEN_CHANNEL_FLOW(B14,B13,B11)

A18: "Hydraulic Properties"
A19: "Wetted perimeter (m):"    B19: =B5+2*B11
A20: "Hydraulic radius (m):"    B20: =(B5*B11)/B19
A21: "Top width (m):"           B21: =B5
A22: "Cross-sectional area:"    B22: =B5*B11
```

### **Compressible Flow Template**
```excel
A1: "Compressible Flow Analysis"
A3: "Gas Properties"
A4: "Gas type:"                 B4: "Air"
A5: "Gamma:"                    B5: 1.4
A6: "Gas constant (J/kg·K):"    B6: 287

A8: "Flow Conditions"
A9: "Temperature (K):"          B9: 288
A10: "Pressure (Pa):"           B10: 101325
A11: "Velocity (m/s):"          B11: 100

A13: "Compressible Flow Analysis"
A14: "Mach number:"             B14: =ENGIVAULT_MACH_NUMBER(B11,B9,B5,B6)
A15: "Speed of sound (m/s):"    B15: =ENGIVAULT_SPEED_OF_SOUND(B9,B5,B6)
A16: "Stagnation pressure:"     B16: =ENGIVAULT_STAGNATION_PRESSURE(B10,B14,B5)
A17: "Stagnation temperature:"  B17: =ENGIVAULT_STAGNATION_TEMPERATURE(B9,B14,B5)
A18: "Flow regime:"             B18: =VALIDATE_COMPRESSIBLE_FLOW(B14,B9,B10)
```

### **Drag Analysis Template**
```excel
A1: "External Flow Drag Analysis"
A3: "Object Properties"
A4: "Geometry:"                 B4: "sphere"
A5: "Characteristic length (m):" B5: 0.1
A6: "Frontal area (m²):"        B6: =PI()*(B5/2)^2

A8: "Fluid Conditions"
A9: "Density (kg/m³):"          B9: 1.225
A10: "Viscosity (Pa·s):"        B10: 1.81E-05
A11: "Velocity (m/s):"          B11: 20

A13: "Drag Analysis"
A14: "Reynolds number:"         B14: =B11*B5*B9/B10
A15: "Drag coefficient:"        B15: =ENGIVAULT_DRAG_COEFFICIENT(B14,B4)
A16: "Dynamic pressure (Pa):"   B16: =DYNAMIC_PRESSURE(B9,B11)
A17: "Drag force (N):"          B17: =ENGIVAULT_DRAG_FORCE(B15,B9,B11,B6)
```

## ⚠️ **Important Considerations**

### **Open Channel Flow**
- **Minimum slope**: 0.0001 (0.01%) for practical drainage
- **Maximum velocity**: 3 m/s for earth channels (erosion limit)
- **Freeboard**: Add 0.3-0.6 m above normal depth for safety

### **Compressible Flow**
- **Choking**: Flow becomes choked when M = 1 at minimum area
- **Shock waves**: Occur in supersonic flow with adverse pressure gradients
- **Real gas effects**: Consider at high pressure/temperature

### **Boundary Layer**
- **Transition**: Occurs around Re = 5×10⁵ for flat plate
- **Separation**: May occur with adverse pressure gradients
- **Surface roughness**: Affects transition and turbulent friction

### **External Flow**
- **Reynolds dependence**: Drag coefficient varies significantly with Re
- **Shape effects**: Streamlined shapes have much lower drag
- **Compressibility**: Consider at high Mach numbers

## 🔧 **Advanced Calculations**

### **Hydraulic Jump Analysis**
```excel
' Hydraulic jump in rectangular channel
Upstream_Depth:   1.0          ' m
Upstream_Froude:  3.0
Downstream_Depth: =B2/2*(-1+SQRT(1+8*B3^2))
Energy_Loss:      =(B4-B2)^3/(4*B2*B4)
```

### **Oblique Shock Analysis**
```excel
' Oblique shock wave (approximate)
Shock_Angle:      45           ' degrees
Mach_1:           2.0
Turn_Angle:       =ASIN(1/B4/SIN(RADIANS(B3)))*180/PI()
Pressure_Ratio:   =1+2*1.4/(1.4+1)*(B4^2*SIN(RADIANS(B3))^2-1)
```

### **Fanno Flow (Friction)**
```excel
' Fanno flow in constant area duct with friction
Friction_Factor:  0.005
Length_Diameter:  50
Mach_Exit:        =SOLVER_FUNCTION  ' Requires iterative solution
```

## 🎯 **Best Practices**

### **Calculation Workflow**
1. **Define problem**: Identify flow type and governing equations
2. **Gather properties**: Fluid properties, geometry, boundary conditions
3. **Check assumptions**: Incompressible vs compressible, laminar vs turbulent
4. **Calculate**: Use appropriate EngiVault functions
5. **Validate**: Check results against physical limits and experience
6. **Optimize**: Iterate design for performance/cost optimization

### **Error Prevention**
```excel
' Input validation
=IF(AND(Flow_Rate>0, Width>0, Slope>0), 
     ENGIVAULT_MANNING_FLOW(...), 
     "Invalid inputs")

' Range checking
=IF(Mach_Number<5, 
     "Valid range", 
     "Hypersonic - consider real gas effects")

' Physical constraints
=IF(Froude_Number<0.8, 
     "Stable subcritical flow", 
     "Check for hydraulic jump")
```

### **Performance Optimization**
- **Cache calculations**: Store intermediate results
- **Use local formulas**: For simple calculations (Mach number, Froude number)
- **Batch API calls**: Group similar calculations
- **Validate inputs**: Prevent unnecessary API calls

---

**💨 The Fluid Mechanics Module transforms EngiVault into the most comprehensive flow analysis platform available, covering everything from river flow to supersonic gas dynamics!**
