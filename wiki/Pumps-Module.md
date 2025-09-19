# Pumps Module - Comprehensive Documentation

## 📖 **Overview**

The Pumps Module provides comprehensive pump analysis and selection capabilities including performance calculations, NPSH analysis, cavitation prevention, and pump system optimization. These calculations are essential for pump selection, system design, and troubleshooting.

## ⚙️ **Available Functions**

### **1. Pump Performance Analysis**

#### **Function Signatures**
```python
# Python SDK
result = client.pumps.performance(
    flow_rate: float,           # m³/s
    head: float,               # m
    efficiency: float,         # 0-1 (decimal)
    power: float              # W
) -> PumpPerformanceResult
```

```excel
' Excel Function
=ENGIVAULT_PUMP_POWER(flow_rate, head, efficiency, power)
```

#### **Mathematical Foundation**

**Hydraulic Power:**
```
P_hydraulic = ρ × g × Q × H = γ × Q × H
```

**Brake Power (Shaft Power):**
```
P_brake = P_hydraulic/η_pump
```

**Motor Power:**
```
P_motor = P_brake/η_motor
```

**Overall Efficiency:**
```
η_overall = η_pump × η_motor × η_drive
```

Where:
- **ρ** = Fluid density (kg/m³)
- **g** = Gravitational acceleration (9.81 m/s²)
- **γ** = Specific weight = ρg (N/m³)
- **Q** = Flow rate (m³/s)
- **H** = Total head (m)
- **η** = Efficiency (decimal)

#### **Specific Speed**
```
N_s = N√Q/H^(3/4)
```

**Specific Speed Classification:**
- **N_s < 20**: Radial flow (centrifugal)
- **20 < N_s < 60**: Mixed flow
- **N_s > 60**: Axial flow

#### **Pump Laws (Affinity Laws)**
For **constant impeller diameter**:
```
Q₂/Q₁ = N₂/N₁
H₂/H₁ = (N₂/N₁)²
P₂/P₁ = (N₂/N₁)³
```

For **constant speed**:
```
Q₂/Q₁ = D₂/D₁
H₂/H₁ = (D₂/D₁)²
P₂/P₁ = (D₂/D₁)³
```

#### **System Head Calculation**
```
H_total = H_static + H_friction + H_velocity + H_pressure
```

**Static Head:**
```
H_static = z₂ - z₁  (elevation difference)
```

**Friction Head:**
```
H_friction = ΔP_friction/(ρg)
```

**Velocity Head:**
```
H_velocity = V²/(2g)
```

**Pressure Head:**
```
H_pressure = (p₂ - p₁)/(ρg)
```

#### **References**
- Karassik, I.J., et al. (2008). "Pump Handbook, 4th Edition". McGraw-Hill.
- Gülich, J.F. (2014). "Centrifugal Pumps, 3rd Edition". Springer.
- API 610 (2010). "Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries".

---

### **2. NPSH Analysis (Cavitation Prevention)**

#### **Function Signatures**
```python
# Python SDK
result = client.pumps.npsh(
    suction_pressure: float,    # Pa
    vapor_pressure: float,      # Pa
    fluid_density: float,       # kg/m³
    suction_velocity: float,    # m/s
    suction_losses: float       # m
) -> NPSHResult
```

```excel
' Excel Function
=ENGIVAULT_NPSH_AVAILABLE(suction_pressure, vapor_pressure, fluid_density, suction_velocity, suction_losses)
```

#### **Mathematical Foundation**

**Net Positive Suction Head Available (NPSHA):**
```
NPSHA = (p_s - p_v)/(ρg) + V_s²/(2g) - h_f
```

Where:
- **p_s** = Suction pressure (Pa)
- **p_v** = Vapor pressure at pumping temperature (Pa)
- **ρ** = Fluid density (kg/m³)
- **g** = Gravitational acceleration (9.81 m/s²)
- **V_s** = Suction velocity (m/s)
- **h_f** = Friction losses in suction line (m)

**Alternative Form:**
```
NPSHA = H_s - H_vp + H_v - H_f
```

Where:
- **H_s** = Suction head = p_s/(ρg)
- **H_vp** = Vapor pressure head = p_v/(ρg)
- **H_v** = Velocity head = V_s²/(2g)
- **H_f** = Friction head losses

#### **NPSH Required (NPSHR)**
- **Manufacturer specification**: From pump performance curves
- **Typical values**: 2-8 m for centrifugal pumps
- **Safety margin**: NPSHA ≥ NPSHR + 0.5 m (minimum)

#### **Cavitation Phenomena**

**Cavitation Inception:**
Occurs when local pressure drops below vapor pressure:
```
p_local ≤ p_vapor
```

**Types of Cavitation:**
1. **Suction cavitation**: Insufficient NPSHA
2. **Discharge cavitation**: High back-pressure
3. **Internal recirculation**: Off-design operation
4. **Vane passing**: Impeller-volute interaction

**Cavitation Effects:**
- **Performance degradation**: Reduced head and efficiency
- **Noise and vibration**: Bubble collapse creates noise
- **Erosion damage**: Material removal from surfaces
- **Mechanical damage**: Bearing and seal failure

#### **Vapor Pressure Data**

| Fluid | Temperature (°C) | Vapor Pressure (Pa) |
|-------|------------------|---------------------|
| **Water** | 20 | 2,337 |
| **Water** | 40 | 7,375 |
| **Water** | 60 | 19,932 |
| **Water** | 80 | 47,373 |
| **Water** | 100 | 101,325 |
| **Gasoline** | 20 | 13,332 |
| **Diesel** | 20 | 133 |
| **Crude Oil** | 20 | 1,333 |

#### **NPSH Improvement Methods**
1. **Increase suction pressure**: Elevate suction tank
2. **Reduce suction losses**: Larger pipes, fewer fittings
3. **Reduce suction velocity**: Larger suction pipe
4. **Cool fluid**: Lower vapor pressure
5. **Use booster pump**: Increase suction pressure

#### **References**
- Hydraulic Institute (2010). "ANSI/HI 9.6.1 Rotodynamic Pumps Guideline for NPSH Margin".
- Fraser, W.H. (1981). "Recirculation in centrifugal pumps". World Pumps, 1981(5), 227-235.
- API 610 (2010). "Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries".

---

## 🔧 **Pump Selection Process**

### **1. System Analysis**
```python
# Calculate system requirements
system_flow = 0.05          # m³/s
static_head = 25            # m elevation
friction_head = 15          # m (from pressure drop calculation)
safety_factor = 1.2
total_head = (static_head + friction_head) * safety_factor

# Result: 48 m total head required
```

### **2. Pump Sizing**
```excel
' Pump selection criteria
Required_Flow:     0.05      ' m³/s
Required_Head:     48        ' m
Fluid_Density:     1000      ' kg/m³
Fluid_Viscosity:   0.001     ' Pa·s

' Calculate specific speed for pump type selection
Pump_Speed:        1750      ' rpm
Specific_Speed:    =B5*SQRT(B3)/(B4^0.75)
' Result: 24.8 (radial flow centrifugal pump)

' Performance analysis
Pump_Efficiency:   0.75      ' Assumed
Hydraulic_Power:   =ENGIVAULT_PUMP_POWER(B3,B4,B7,Motor_Power)
Motor_Power:       =B8/0.9   ' 90% motor efficiency
```

### **3. NPSH Analysis**
```python
# NPSH calculation
npsh_result = client.pumps.npsh(
    suction_pressure=101325,    # Pa (atmospheric)
    vapor_pressure=2337,        # Pa (water at 20°C)
    fluid_density=1000,         # kg/m³
    suction_velocity=1.5,       # m/s
    suction_losses=2.0          # m
)

# Results:
# npsh_available: 8.45 m
# npsh_required: 4.0 m (from pump curve)
# margin: 4.45 m (excellent)
# is_cavitation_risk: False
```

## 📊 **Pump Performance Curves**

### **Typical Centrifugal Pump Characteristics**

**Head-Flow Relationship:**
```
H = H₀ - K₁Q - K₂Q²
```
Where H₀ = shutoff head, K₁, K₂ = pump constants

**Efficiency-Flow Relationship:**
```
η = η_max × [1 - ((Q - Q_BEP)/Q_BEP)²]
```
Where Q_BEP = flow rate at best efficiency point

**Power-Flow Relationship:**
```
P = P₀ + K₃Q + K₄Q²
```

### **Pump Selection Charts**

| Specific Speed | Pump Type | Typical Efficiency | Applications |
|----------------|-----------|-------------------|--------------|
| **5-20** | Radial (centrifugal) | 70-85% | High head, low flow |
| **20-60** | Mixed flow | 80-90% | Medium head and flow |
| **60-200** | Axial (propeller) | 85-92% | Low head, high flow |
| **200+** | Specialized axial | 90-95% | Very low head, very high flow |

### **Application Guidelines**

| Application | Head Range | Flow Range | Pump Type |
|-------------|------------|------------|-----------|
| **Boiler feed** | 100-2000 m | 0.01-1 m³/s | Multi-stage centrifugal |
| **Cooling water** | 20-100 m | 0.1-10 m³/s | Single-stage centrifugal |
| **Process** | 50-500 m | 0.001-5 m³/s | Centrifugal |
| **Drainage** | 5-50 m | 0.1-50 m³/s | Mixed flow |
| **Irrigation** | 10-200 m | 0.05-20 m³/s | Centrifugal |
| **Fire protection** | 50-150 m | 0.05-2 m³/s | Centrifugal |

## 🔍 **Troubleshooting Guide**

### **Common Pump Problems**

#### **Cavitation Symptoms**
- **Noise**: Crackling, rattling sounds
- **Vibration**: Excessive pump vibration
- **Performance loss**: Reduced head and flow
- **Erosion**: Pitting on impeller surfaces

**Solution**: Increase NPSHA or reduce NPSHR

#### **Low Efficiency**
- **Worn impeller**: Replace or repair
- **Wrong operating point**: Adjust system or trim impeller
- **Internal recirculation**: Check for minimum flow requirements
- **Mechanical issues**: Alignment, bearing condition

#### **Excessive Power Consumption**
- **Higher than design flow**: Check system curve
- **Increased fluid density**: Verify fluid properties
- **Mechanical problems**: Misalignment, worn bearings
- **Wrong impeller**: Verify pump configuration

### **Performance Testing**
**Field test procedure** (per HI 14.6):
1. **Measure flow rate**: Ultrasonic, magnetic, or orifice meter
2. **Measure pressures**: Suction and discharge pressures
3. **Calculate head**: H = (p_d - p_s)/(ρg) + (z_d - z_s) + (V_d² - V_s²)/(2g)
4. **Measure power**: Motor power with correction factors
5. **Calculate efficiency**: η = (ρgQH)/P_brake

## 🧮 **Calculation Examples**

### **Example 1: Cooling Water Pump Selection**
```python
# Cooling water system
system_analysis = {
    'flow_rate': 0.2,          # m³/s (200 L/s)
    'static_head': 15,         # m
    'friction_losses': 12,     # m (from pipe analysis)
    'safety_factor': 1.15
}

total_head = (system_analysis['static_head'] + system_analysis['friction_losses']) * system_analysis['safety_factor']
# Result: 31.05 m

# Pump performance analysis
result = client.pumps.performance(
    flow_rate=0.2,
    head=31.05,
    efficiency=0.78,           # Typical for this size
    power=12000               # W (estimated)
)

# Results:
# hydraulic_power: 6.10 kW
# brake_power: 7.82 kW
# specific_speed: 31.6 (radial flow)
# efficiency: 0.78 (78%)
```

### **Example 2: NPSH Analysis for Hot Water Pump**
```python
# Hot water pumping system
npsh_analysis = client.pumps.npsh(
    suction_pressure=101325,    # Pa (atmospheric tank)
    vapor_pressure=12344,       # Pa (water at 50°C)
    fluid_density=988,          # kg/m³ (water at 50°C)
    suction_velocity=2.0,       # m/s
    suction_losses=3.5          # m (pipe friction + fittings)
)

# Results:
# npsh_available: 6.33 m
# npsh_required: 4.5 m (from pump curve)
# margin: 1.83 m
# is_cavitation_risk: False (margin > 0.5 m)
```

### **Example 3: Pump System Curve Analysis**
```excel
' System curve generation
A1: "Pump System Analysis"
A3: "System Parameters"
A4: "Static head (m):"          B4: 20
A5: "Pipe diameter (m):"        B5: 0.15
A6: "Pipe length (m):"          B6: 300
A7: "Fluid density (kg/m³):"    B7: 1000
A8: "Fluid viscosity (Pa·s):"   B8: 0.001

' Flow rate range for system curve
A10: "Flow Rate (m³/s)"
A11: 0
A12: 0.05
A13: 0.1
A14: 0.15
A15: 0.2

' System head calculation
B10: "System Head (m)"
B11: =B4  ' Static head only at zero flow
B12: =B4+ENGIVAULT_PRESSURE_DROP(A12,B5,B6,B7,B8)/(B7*9.81)
B13: =B4+ENGIVAULT_PRESSURE_DROP(A13,B5,B6,B7,B8)/(B7*9.81)
B14: =B4+ENGIVAULT_PRESSURE_DROP(A14,B5,B6,B7,B8)/(B7*9.81)
B15: =B4+ENGIVAULT_PRESSURE_DROP(A15,B5,B6,B7,B8)/(B7*9.81)

' Pump curve (typical centrifugal)
C10: "Pump Head (m)"
C11: 45      ' Shutoff head
C12: 44.5    ' 95% of shutoff
C13: 43      ' 90% of shutoff
C14: 40      ' 80% of shutoff
C15: 35      ' 70% of shutoff

' Operating point (intersection)
D10: "Efficiency (%)"
D11: 0       ' No flow
D12: 65
D13: 78      ' BEP
D14: 75
D15: 68
```

---

### **3. Pump Selection Criteria**

#### **Performance Requirements**
1. **Flow rate**: Normal, minimum, maximum
2. **Head**: Total dynamic head at design point
3. **Efficiency**: Target > 70% for most applications
4. **NPSH**: Available > Required + 0.5 m margin
5. **Speed**: Synchronous speeds (3600, 1800, 1200, 900 rpm)

#### **Physical Constraints**
1. **Size limitations**: Available space
2. **Weight restrictions**: Foundation requirements
3. **Maintenance access**: Clearances for service
4. **Piping connections**: Suction and discharge sizes
5. **Drive requirements**: Motor or engine specifications

#### **Economic Factors**
1. **Capital cost**: Pump + motor + installation
2. **Operating cost**: Energy consumption
3. **Maintenance cost**: Spare parts, labor
4. **Life cycle cost**: 20-year analysis typical

**Life Cycle Cost Analysis:**
```
LCC = C_capital + C_energy + C_maintenance + C_downtime
```

**Energy Cost (dominant for large pumps):**
```
C_energy = (P_brake × Hours × $/kWh × Years)/1000
```

#### **Pump Selection Chart**

| Head (m) | Flow (m³/s) | Recommended Type | Typical Efficiency |
|----------|-------------|------------------|-------------------|
| **< 15** | **< 0.1** | End suction | 60-75% |
| **15-50** | **0.01-1** | End suction | 70-85% |
| **50-150** | **0.05-5** | Between bearings | 75-88% |
| **150-500** | **0.01-2** | Multi-stage | 70-85% |
| **> 500** | **0.001-0.5** | High-pressure multi-stage | 65-80% |

#### **References**
- Hydraulic Institute (2017). "ANSI/HI 14.3 Rotodynamic Pumps for Design and Application".
- McNally Institute (2005). "Pump Selection and Application". McNally Institute.
- Europump & Hydraulic Institute (2004). "Variable Speed Pumping - A Guide to Successful Applications".

---

## 🏭 **Industry Applications**

### **Water & Wastewater**
- **Municipal water supply**: Distribution pumps, booster stations
- **Wastewater treatment**: Raw sewage, activated sludge, effluent
- **Water treatment**: High-pressure RO, chemical feed
- **Irrigation**: Agricultural, landscape irrigation systems

### **Oil & Gas**
- **Crude oil transfer**: Pipeline, tank farm, refinery
- **Product pumping**: Gasoline, diesel, jet fuel
- **Chemical injection**: Corrosion inhibitors, biocides
- **Enhanced oil recovery**: Water flood, chemical flood

### **Chemical Process**
- **Process pumps**: Chemical transfer, reactor feed
- **Utility pumps**: Cooling water, steam condensate
- **Specialty pumps**: Corrosive, high-temperature fluids
- **Metering pumps**: Precise chemical dosing

### **Power Generation**
- **Boiler feed pumps**: High-pressure, high-temperature
- **Cooling water pumps**: Condenser cooling, service water
- **Fuel pumps**: Coal slurry, oil, gas
- **Auxiliary pumps**: Lubrication, hydraulic systems

### **HVAC & Building Services**
- **Chilled water pumps**: Air conditioning systems
- **Hot water pumps**: Heating systems, domestic hot water
- **Condenser water pumps**: Cooling tower circulation
- **Fire pumps**: Fire protection systems

## 📊 **Design Guidelines**

### **Pump Sizing Rules of Thumb**
1. **Specific speed**: 20-60 for best efficiency
2. **Suction specific speed**: < 8500 to avoid cavitation
3. **Minimum flow**: > 10% of BEP flow
4. **Maximum flow**: < 120% of BEP flow
5. **Operating range**: ±20% of BEP for good efficiency

### **NPSH Design Guidelines**
1. **NPSH margin**: Minimum 0.5 m, prefer 1.5-3.0 m
2. **Suction velocity**: < 2.5 m/s for water
3. **Suction pipe size**: One size larger than pump suction
4. **Eccentric reducer**: Flat side up to prevent air pockets
5. **Straight pipe**: 5-10 diameters before pump suction

### **System Design Best Practices**
1. **Avoid high suction lifts**: Keep pump close to source
2. **Minimize suction losses**: Short, large pipes
3. **Provide adequate NPSH**: Design with margin
4. **Size for future**: Consider system expansion
5. **Variable speed**: Consider VFDs for energy savings

## 🔬 **Advanced Analysis**

### **Pump Curves and Performance Maps**
**Head-capacity curve fitting**:
```
H = a₀ + a₁Q + a₂Q²
```

**Efficiency curve fitting**:
```
η = b₀ + b₁Q + b₂Q²
```

**Power curve fitting**:
```
P = c₀ + c₁Q + c₂Q²
```

### **Variable Speed Analysis**
**Affinity laws with speed variation**:
```
Q₂ = Q₁ × (N₂/N₁)
H₂ = H₁ × (N₂/N₁)²
P₂ = P₁ × (N₂/N₁)³
```

**Energy savings with VFD**:
```
Power_savings = P_rated × [1 - (Q_actual/Q_rated)³]
```

### **Parallel and Series Operation**
**Parallel pumps**:
```
Q_total = Q₁ + Q₂  (at same head)
H_system = H_pump  (same head)
```

**Series pumps**:
```
H_total = H₁ + H₂  (at same flow)
Q_system = Q_pump  (same flow)
```

## 📚 **Complete Reference Library**

### **Pump Design & Selection**
1. **Karassik, I.J., et al.** (2008). "Pump Handbook, 4th Edition". McGraw-Hill.
2. **Gülich, J.F.** (2014). "Centrifugal Pumps, 3rd Edition". Springer.
3. **Lobanoff, V.S. & Ross, R.R.** (2013). "Centrifugal Pumps: Design and Application, 2nd Edition". Gulf Professional.

### **Industry Standards**
1. **API 610** (2010). "Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries".
2. **ANSI/HI 14.3** (2017). "Rotodynamic Pumps for Design and Application".
3. **ISO 13709** (2009). "Centrifugal pumps for petroleum, petrochemical and natural gas industries".

### **NPSH & Cavitation**
1. **Hydraulic Institute** (2010). "ANSI/HI 9.6.1 Rotodynamic Pumps Guideline for NPSH Margin".
2. **Fraser, W.H.** (1981). "Recirculation in centrifugal pumps". World Pumps.
3. **Stepanoff, A.J.** (1957). "Centrifugal and Axial Flow Pumps, 2nd Edition". Wiley.

### **System Design**
1. **Hydraulic Institute** (2017). "ANSI/HI 14.3 Rotodynamic Pumps for Design and Application".
2. **McNally Institute** (2005). "Pump Selection and Application".
3. **Europump & Hydraulic Institute** (2004). "Variable Speed Pumping".

---

**⚙️ The Pumps Module provides comprehensive pump analysis capabilities essential for proper pump selection, system design, and troubleshooting, with industry-standard correlations and best practices.**
