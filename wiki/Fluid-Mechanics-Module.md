# Fluid Mechanics Module - Comprehensive Documentation

## 📖 **Overview**

The Fluid Mechanics Module provides advanced fluid flow analysis covering open channel flow, compressible flow, boundary layer analysis, and external flow over objects. These calculations are essential for civil, aerospace, and mechanical engineering applications.

## 💨 **Available Functions**

### **1. Open Channel Flow (Manning's Equation)**

#### **Function Signatures**
```python
# Python SDK
result = client.fluid_mechanics.open_channel_flow(
    flow_rate: float,           # m³/s
    channel_width: float,       # m
    channel_slope: float,       # dimensionless (S₀)
    mannings_coeff: float,      # Manning's n
    channel_shape: str = "rectangular",
    side_slope: float = 0       # m:1 for trapezoidal
) -> OpenChannelFlowResult
```

```excel
' Excel Function
=ENGIVAULT_MANNING_FLOW(flow_rate, channel_width, channel_slope, mannings_coeff, [channel_shape], [side_slope])
```

#### **Mathematical Foundation**

**Manning's Equation:**
```
Q = (1/n) × A × R^(2/3) × S₀^(1/2)
```

Where:
- **Q** = Flow rate (m³/s)
- **n** = Manning's roughness coefficient
- **A** = Cross-sectional area (m²)
- **R** = Hydraulic radius = A/P (m)
- **P** = Wetted perimeter (m)
- **S₀** = Channel slope (dimensionless)

#### **Channel Geometries**

**Rectangular Channel:**
```
A = B × y
P = B + 2y
R = By/(B + 2y)
T = B  (top width)
```

**Trapezoidal Channel:**
```
A = y(B + my)
P = B + 2y√(1 + m²)
R = y(B + my)/(B + 2y√(1 + m²))
T = B + 2my
```

**Circular Channel:**
```
A = (D²/8)(θ - sin θ)
P = Dθ/2
R = D(θ - sin θ)/(4θ)
```
Where θ = central angle for flow depth

#### **Critical Depth Calculation**

**For Rectangular Channels:**
```
y_c = (Q²/(gB²))^(1/3)
```

**For General Channels (iterative solution):**
```
Q = √(gA³/T)  at critical conditions
```

#### **Froude Number**
```
Fr = V/√(gy_h)
```
Where y_h = hydraulic depth = A/T

**Flow Classification:**
- **Fr < 1**: Subcritical flow (tranquil, stable)
- **Fr = 1**: Critical flow (unstable, avoid in design)
- **Fr > 1**: Supercritical flow (rapid, erosive)

#### **Manning's Roughness Coefficients**

| Channel Type | Manning's n | Description |
|--------------|-------------|-------------|
| **Glass, plastic** | 0.009-0.010 | Laboratory flumes |
| **Smooth concrete** | 0.012-0.014 | Precast, steel-form finish |
| **Ordinary concrete** | 0.013-0.017 | Good workmanship |
| **Rough concrete** | 0.015-0.020 | Poor workmanship |
| **Smooth earth** | 0.017-0.025 | Carefully graded |
| **Earth with stones** | 0.025-0.035 | Some weeds, stones |
| **Natural channels** | 0.025-0.075 | Clean to heavily weeded |
| **Floodplains** | 0.025-0.150 | Pasture to heavy brush |

#### **Implementation Algorithm**
```typescript
function calculateNormalDepth(Q, B, S, n, shape, m) {
  let depth = 1.0;  // Initial guess
  let iteration = 0;
  const maxIterations = 50;
  const tolerance = 1e-6;
  
  while (iteration < maxIterations) {
    const props = calculateHydraulicProperties(depth, B, shape, m);
    const calculatedQ = (1/n) * props.area * Math.pow(props.hydraulicRadius, 2/3) * Math.sqrt(S);
    
    const error = Math.abs(calculatedQ - Q) / Q;
    if (error < tolerance) break;
    
    // Newton-Raphson iteration
    const deltaDepth = 0.001;
    const propsPlus = calculateHydraulicProperties(depth + deltaDepth, B, shape, m);
    const qPlus = (1/n) * propsPlus.area * Math.pow(propsPlus.hydraulicRadius, 2/3) * Math.sqrt(S);
    
    const dQdY = (qPlus - calculatedQ) / deltaDepth;
    depth = depth + (Q - calculatedQ) / dQdY;
    
    iteration++;
  }
  
  return depth;
}
```

#### **References**
- Chow, V.T. (1959). "Open-Channel Hydraulics". McGraw-Hill.
- Henderson, F.M. (1966). "Open Channel Flow". Macmillan.
- French, R.H. (1985). "Open-Channel Hydraulics". McGraw-Hill.

---

### **2. Compressible Flow Analysis**

#### **Function Signatures**
```python
# Python SDK
result = client.fluid_mechanics.compressible_flow(
    temperature: float,         # K
    pressure: float,           # Pa
    gas_properties: dict,      # {gamma, gasConstant, molecularWeight}
    mach_number: float = None, # If known
    velocity: float = None,    # m/s (if Mach unknown)
    flow_type: str = "isentropic"
) -> CompressibleFlowResult
```

```excel
' Excel Functions
=ENGIVAULT_MACH_NUMBER(velocity, temperature, [gamma], [gas_constant])
=ENGIVAULT_SPEED_OF_SOUND(temperature, [gamma], [gas_constant])
=ENGIVAULT_STAGNATION_PRESSURE(static_pressure, mach_number, [gamma])
=ENGIVAULT_STAGNATION_TEMPERATURE(static_temperature, mach_number, [gamma])
```

#### **Mathematical Foundation**

**Isentropic Flow Relations:**

**Speed of Sound:**
```
a = √(γRT)
```

**Mach Number:**
```
M = V/a
```

**Stagnation Properties:**
```
T₀/T = 1 + ((γ-1)/2)M²
p₀/p = [1 + ((γ-1)/2)M²]^(γ/(γ-1))
ρ₀/ρ = [1 + ((γ-1)/2)M²]^(1/(γ-1))
```

#### **Flow Regimes**
- **M < 0.3**: **Incompressible** - Density changes < 5%
- **0.3 ≤ M < 1**: **Compressible subsonic** - Significant density changes
- **M = 1**: **Sonic** - Critical flow, maximum mass flow rate
- **M > 1**: **Supersonic** - Shock waves possible

#### **Critical Flow (Choked Flow)**
At the throat of a converging-diverging nozzle:
```
T* = T₀ × 2/(γ+1)
p* = p₀ × [2/(γ+1)]^(γ/(γ-1))
ρ* = ρ₀ × [2/(γ+1)]^(1/(γ-1))
a* = √(γRT*)
```

**Mass Flow Rate (choked):**
```
ṁ = ρ*a*A* = p₀A*√(γ/RT₀) × [2/(γ+1)]^((γ+1)/(2(γ-1)))
```

#### **Gas Properties**

| Gas | γ | R (J/kg·K) | MW (kg/kmol) | Application |
|-----|---|------------|--------------|-------------|
| **Air** | 1.40 | 287 | 28.97 | General, HVAC |
| **Steam** | 1.33 | 462 | 18.02 | Power generation |
| **Natural Gas** | 1.30 | 518 | 16.04 | Gas pipelines |
| **Hydrogen** | 1.41 | 4124 | 2.02 | Fuel cells, rockets |
| **Carbon Dioxide** | 1.30 | 189 | 44.01 | Refrigeration |
| **Nitrogen** | 1.40 | 297 | 28.01 | Inert gas systems |
| **Oxygen** | 1.40 | 260 | 32.00 | Medical, industrial |

#### **References**
- Anderson, J.D. (2003). "Modern Compressible Flow, 3rd Edition". McGraw-Hill.
- Shapiro, A.H. (1953). "The Dynamics and Thermodynamics of Compressible Fluid Flow". Ronald Press.
- Zucker, R.D. & Biblarz, O. (2002). "Fundamentals of Gas Dynamics, 2nd Edition". Wiley.

---

### **3. Boundary Layer Analysis**

#### **Function Signatures**
```python
# Python SDK
result = client.fluid_mechanics.boundary_layer(
    velocity: float,            # m/s
    distance: float,           # m
    fluid_properties: dict,    # {density, viscosity, kinematicViscosity}
    surface_roughness: float = None,
    plate_length: float = None
) -> BoundaryLayerResult
```

```excel
' Excel Functions
=ENGIVAULT_BOUNDARY_LAYER_THICKNESS(reynolds_number, distance, [flow_regime])
=ENGIVAULT_SKIN_FRICTION(reynolds_number, [flow_regime])
```

#### **Mathematical Foundation**

**Boundary Layer Equations (Prandtl, 1904):**
```
∂u/∂x + ∂v/∂y = 0  (continuity)
u(∂u/∂x) + v(∂u/∂y) = -(1/ρ)(∂p/∂x) + ν(∂²u/∂y²)  (momentum)
```

#### **Laminar Boundary Layer (Blasius Solution)**

**Boundary Layer Thickness:**
```
δ/x = 5.0/√(Re_x)
```

**Displacement Thickness:**
```
δ*/x = 1.721/√(Re_x)
```

**Momentum Thickness:**
```
θ/x = 0.664/√(Re_x)
```

**Local Skin Friction Coefficient:**
```
C_f,x = 0.664/√(Re_x)
```

**Wall Shear Stress:**
```
τ_w = C_f,x × (ρU²/2)
```

#### **Turbulent Boundary Layer**

**Boundary Layer Thickness (1/7 power law):**
```
δ/x = 0.37/(Re_x)^0.2
```

**Displacement Thickness:**
```
δ*/x = 0.046/(Re_x)^0.2
```

**Momentum Thickness:**
```
θ/x = 0.036/(Re_x)^0.2
```

**Local Skin Friction Coefficient:**
```
C_f,x = 0.058/(Re_x)^0.2
```

#### **Transition Criteria**
- **Critical Reynolds number**: Re_crit ≈ 5×10⁵ (flat plate, zero pressure gradient)
- **Turbulence intensity**: Higher turbulence → earlier transition
- **Surface roughness**: Rougher surface → earlier transition
- **Pressure gradient**: Adverse gradient → earlier transition

#### **Applications**
- **Drag calculation**: Total drag = pressure drag + friction drag
- **Heat transfer**: Convective heat transfer coefficient calculation
- **Mass transfer**: Mass transfer coefficient determination
- **Flow control**: Boundary layer manipulation for drag reduction

#### **References**
- Blasius, H. (1908). "Grenzschichten in Flüssigkeiten mit kleiner Reibung". Zeitschrift für Mathematik und Physik, 56, 1-37.
- Schlichting, H. & Gersten, K. (2017). "Boundary Layer Theory, 9th Edition". Springer.
- White, F.M. (2006). "Viscous Fluid Flow, 3rd Edition". McGraw-Hill.

---

### **4. External Flow Analysis**

#### **Function Signatures**
```python
# Python SDK
result = client.fluid_mechanics.external_flow(
    velocity: float,            # m/s
    characteristic_length: float, # m
    fluid_properties: dict,     # {density, viscosity}
    geometry: str,             # 'sphere', 'cylinder', 'flat_plate', 'airfoil'
    angle_of_attack: float = None  # degrees (for airfoil)
) -> ExternalFlowResult
```

```excel
' Excel Functions
=ENGIVAULT_DRAG_COEFFICIENT(reynolds_number, geometry)
=ENGIVAULT_DRAG_FORCE(drag_coefficient, density, velocity, frontal_area)
```

#### **Mathematical Foundation**

**Drag Force:**
```
F_D = C_D × (ρV²/2) × A
```

**Lift Force:**
```
F_L = C_L × (ρV²/2) × A
```

Where:
- **C_D** = Drag coefficient (dimensionless)
- **C_L** = Lift coefficient (dimensionless)
- **ρ** = Fluid density (kg/m³)
- **V** = Free stream velocity (m/s)
- **A** = Reference area (m²)

#### **Drag Coefficient Correlations**

**Sphere:**
- **Stokes flow** (Re < 1): C_D = 24/Re
- **Intermediate** (1 < Re < 1000): C_D = 24/Re × (1 + 0.15Re^0.687)
- **Newton's law** (10³ < Re < 2×10⁵): C_D = 0.44
- **Post-critical** (Re > 2×10⁵): C_D = 0.1

**Circular Cylinder (crossflow):**
- **Creeping flow** (Re < 1): C_D = 8π/Re
- **Intermediate** (1 < Re < 40): C_D = 5.8/√Re
- **Subcritical** (40 < Re < 10³): C_D = 1.2
- **Critical** (10³ < Re < 2×10⁵): C_D = 0.3
- **Post-critical** (Re > 2×10⁵): C_D = 0.7

**Flat Plate (parallel flow):**
- **Laminar** (Re < 5×10⁵): C_D = 1.328/√Re
- **Turbulent** (Re > 5×10⁵): C_D = 0.074/Re^0.2

**Airfoil (NACA 0012 approximation):**
```
C_L = 2π × α  (thin airfoil theory, α in radians)
C_D = C_D0 + K × C_L²  (drag polar)
```

#### **Flow Phenomena**

**Separation:** Occurs when adverse pressure gradient overcomes momentum
**Vortex shedding:** Periodic vortex formation behind bluff bodies
**Drag crisis:** Sudden drop in drag coefficient due to boundary layer transition

#### **References**
- Hoerner, S.F. (1965). "Fluid-Dynamic Drag". Hoerner Fluid Dynamics.
- Batchelor, G.K. (2000). "An Introduction to Fluid Dynamics". Cambridge University Press.
- Anderson, J.D. (2017). "Fundamentals of Aerodynamics, 6th Edition". McGraw-Hill.

---

### **5. Normal Shock Wave Analysis**

#### **Function Signatures**
```python
# Python SDK
result = client.fluid_mechanics.normal_shock(
    mach_number_1: float,       # Upstream Mach number (> 1)
    gamma: float = 1.4         # Specific heat ratio
) -> dict
```

```excel
' Excel Functions
=ENGIVAULT_NORMAL_SHOCK_PRESSURE(mach_1, [gamma])
=ENGIVAULT_NORMAL_SHOCK_MACH(mach_1, [gamma])
```

#### **Mathematical Foundation**

**Rankine-Hugoniot Relations:**

**Pressure Ratio:**
```
p₂/p₁ = (2γM₁² - (γ-1))/(γ+1)
```

**Density Ratio:**
```
ρ₂/ρ₁ = ((γ+1)M₁²)/((γ-1)M₁² + 2)
```

**Temperature Ratio:**
```
T₂/T₁ = [2γM₁² - (γ-1)][(γ-1)M₁² + 2]/[(γ+1)²M₁²]
```

**Downstream Mach Number:**
```
M₂² = (M₁² + 2/(γ-1))/(2γM₁²/(γ-1) - 1)
```

**Stagnation Pressure Ratio (Entropy Increase):**
```
p₀₂/p₀₁ = [(γ+1)M₁²/((γ-1)M₁²+2)]^(γ/(γ-1)) × [(γ+1)/(2γM₁²-(γ-1))]^(1/(γ-1))
```

#### **Physical Significance**
- **Pressure jump**: Always increases across shock
- **Velocity decrease**: Supersonic → subsonic
- **Temperature rise**: Kinetic energy → internal energy
- **Entropy increase**: Irreversible process
- **Stagnation pressure loss**: Measure of inefficiency

#### **Engineering Applications**
- **Supersonic inlets**: Aircraft engine design
- **Wind tunnels**: Test section flow quality
- **Explosion analysis**: Blast wave propagation
- **Gas dynamics**: Nozzle and diffuser design

#### **References**
- Liepmann, H.W. & Roshko, A. (2001). "Elements of Gasdynamics". Dover Publications.
- Thompson, P.A. (1972). "Compressible-Fluid Dynamics". McGraw-Hill.

---

## 🌊 **Calculation Examples**

### **Example 1: Storm Drainage Design**
```python
# Urban storm drain sizing
result = client.fluid_mechanics.open_channel_flow(
    flow_rate=2.5,             # m³/s (peak storm flow)
    channel_width=2.0,         # m
    channel_slope=0.005,       # 0.5% slope
    mannings_coeff=0.013,      # Smooth concrete
    channel_shape="rectangular"
)

# Results:
# normal_depth: 1.12 m
# critical_depth: 0.89 m
# velocity: 1.12 m/s
# froude_number: 0.34 (subcritical - good)
# flow_regime: "subcritical"
```

### **Example 2: Aircraft Wing Analysis**
```python
# Boundary layer on aircraft wing
air_properties = {
    'density': 0.414,          # kg/m³ at 10 km altitude
    'viscosity': 1.46e-5,      # Pa·s at -50°C
    'kinematicViscosity': 3.53e-5  # m²/s
}

result = client.fluid_mechanics.boundary_layer(
    velocity=250,              # m/s (cruise speed)
    distance=2.0,              # m (chord length)
    fluid_properties=air_properties
)

# Results:
# reynolds_number: 1.42×10⁷ (turbulent)
# boundary_layer_thickness: 0.0156 m (15.6 mm)
# skin_friction_coefficient: 0.00285
# wall_shear_stress: 37.1 Pa
```

### **Example 3: Gas Turbine Analysis**
```python
# Compressible flow in gas turbine
gas_properties = {
    'gamma': 1.33,             # Hot combustion gas
    'gasConstant': 287,        # J/kg·K
    'molecularWeight': 28.97   # kg/kmol
}

result = client.fluid_mechanics.compressible_flow(
    temperature=1200,          # K (927°C)
    pressure=1500000,          # Pa (15 bar)
    gas_properties=gas_properties,
    velocity=400               # m/s
)

# Results:
# mach_number: 0.55 (subsonic)
# speed_of_sound: 732 m/s
# stagnation_temperature: 1309 K
# stagnation_pressure: 1.89 MPa
# flow_regime: "subsonic"
```

### **Example 4: Supersonic Nozzle Design**
```excel
' Convergent-divergent nozzle
Inlet_Pressure:    500000    ' Pa (5 bar)
Inlet_Temperature: 600       ' K
Gamma:             1.33      ' Hot gas
Gas_Constant:      287       ' J/kg·K

' Critical conditions (throat)
Critical_Pressure: =B2*(2/(B5+1))^(B5/(B5-1))
Critical_Temp:     =B3*2/(B5+1)
Critical_Velocity: =ENGIVAULT_SPEED_OF_SOUND(B7,B5,B6)

' Exit conditions (supersonic)
Exit_Mach:         3.0
Exit_Pressure:     =B7/((1+(B5-1)/2*B10^2)^(B5/(B5-1)))
Area_Ratio:        =1/B10*((2+(B5-1)*B10^2)/(B5+1))^((B5+1)/(2*(B5-1)))

' Shock analysis (if present)
Shock_Pressure:    =ENGIVAULT_NORMAL_SHOCK_PRESSURE(B10,B5)
Shock_Mach:        =ENGIVAULT_NORMAL_SHOCK_MACH(B10,B5)
```

---

## 🔬 **Advanced Topics**

### **Hydraulic Jump**
For **rectangular channels**:
```
y₂/y₁ = 0.5(-1 + √(1 + 8Fr₁²))
```

**Energy loss**:
```
ΔE = (y₂ - y₁)³/(4y₁y₂)
```

### **Gradually Varied Flow**
**Differential equation**:
```
dy/dx = (S₀ - Sf)/(1 - Fr²)
```

Where:
- **S₀** = Channel slope
- **Sf** = Friction slope = n²V²/(R^(4/3))
- **Fr** = Froude number

### **Oblique Shock Waves**
**θ-β-M relation**:
```
tan θ = 2 cot β × [(M₁²sin²β - 1)/(M₁²(γ + cos 2β) + 2)]
```

Where:
- **θ** = Flow deflection angle
- **β** = Shock wave angle
- **M₁** = Upstream Mach number

### **Prandtl-Meyer Expansion**
For **isentropic expansion** around corners:
```
ν(M) = √((γ+1)/(γ-1)) × arctan(√((γ-1)/(γ+1))(M²-1)) - arctan(√(M²-1))
```

## 📊 **Design Guidelines**

### **Open Channel Flow Design**
1. **Select Manning's n**: Based on channel material and condition
2. **Determine slope**: Balance between excavation cost and channel size
3. **Calculate normal depth**: Using Manning's equation
4. **Check Froude number**: Ensure subcritical flow (Fr < 0.8)
5. **Add freeboard**: 0.3-0.6 m above normal depth
6. **Verify capacity**: Check for design flow plus safety factor

### **Compressible Flow Design**
1. **Classify flow regime**: Based on Mach number
2. **Select correlations**: Appropriate for Mach number range
3. **Account for losses**: Friction, heat transfer, area change
4. **Design for choking**: Avoid unless intentional
5. **Consider shock waves**: In supersonic flow regions

### **Boundary Layer Design**
1. **Predict transition**: Estimate transition location
2. **Calculate friction**: Integrate skin friction over surface
3. **Prevent separation**: Avoid adverse pressure gradients
4. **Control transition**: Use trip strips if needed
5. **Optimize shape**: Minimize pressure drag

## 📚 **Complete Reference Library**

### **Open Channel Flow**
1. **Chow, V.T.** (1959). "Open-Channel Hydraulics". McGraw-Hill.
2. **Sturm, T.W.** (2010). "Open Channel Hydraulics, 2nd Edition". McGraw-Hill.
3. **Chanson, H.** (2004). "The Hydraulics of Open Channel Flow, 2nd Edition". Butterworth-Heinemann.

### **Compressible Flow**
1. **Anderson, J.D.** (2003). "Modern Compressible Flow, 3rd Edition". McGraw-Hill.
2. **Oosthuizen, P.H. & Carscallen, W.E.** (2013). "Introduction to Compressible Fluid Flow, 2nd Edition". CRC Press.
3. **Saad, M.A.** (1993). "Compressible Fluid Flow, 2nd Edition". Prentice Hall.

### **Boundary Layer Theory**
1. **Schlichting, H. & Gersten, K.** (2017). "Boundary Layer Theory, 9th Edition". Springer.
2. **White, F.M.** (2006). "Viscous Fluid Flow, 3rd Edition". McGraw-Hill.
3. **Kays, W.M., et al.** (2005). "Convective Heat and Mass Transfer, 4th Edition". McGraw-Hill.

### **External Flow**
1. **Hoerner, S.F.** (1965). "Fluid-Dynamic Drag". Hoerner Fluid Dynamics.
2. **Batchelor, G.K.** (2000). "An Introduction to Fluid Dynamics". Cambridge University Press.
3. **Tritton, D.J.** (1988). "Physical Fluid Dynamics, 2nd Edition". Oxford University Press.

### **Industry Standards**
1. **ASCE Manual 54** (2014). "Hydraulic Design of Highway Culverts, 3rd Edition".
2. **HEC-RAS** (2016). "River Analysis System Hydraulic Reference Manual". US Army Corps of Engineers.
3. **ISO 4359** (2013). "Flow measurement - Principles and methods".

---

**💨 The Fluid Mechanics Module provides advanced flow analysis capabilities essential for civil, aerospace, and mechanical engineering applications, with rigorous mathematical foundations based on fundamental fluid mechanics principles.**
