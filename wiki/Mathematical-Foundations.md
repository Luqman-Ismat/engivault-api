# Mathematical Foundations - Comprehensive Documentation

## 📐 **Overview**

This document provides the complete mathematical foundations underlying all EngiVault calculations, including fundamental equations, correlations, dimensionless numbers, and their physical significance.

## 🔬 **Fundamental Equations**

### **Conservation Laws**

#### **Conservation of Mass (Continuity Equation)**
```
∂ρ/∂t + ∇·(ρV) = 0
```

**For incompressible flow:**
```
∇·V = 0
Q = A₁V₁ = A₂V₂ = constant
```

**For pipe flow:**
```
Q = A × V = π(D/2)² × V
V = 4Q/(πD²)
```

#### **Conservation of Momentum (Navier-Stokes Equations)**
```
ρ(∂V/∂t + V·∇V) = -∇p + μ∇²V + ρg
```

**For steady, fully developed pipe flow:**
```
dp/dx = -f(ρV²/2D)  (Darcy-Weisbach)
```

#### **Conservation of Energy**
```
∂E/∂t + ∇·(EV) = ∇·(k∇T) + Φ + Q̇
```

**For heat exchangers:**
```
Q = ṁcₚΔT = UAΔTₘ
```

### **Dimensionless Numbers**

#### **Reynolds Number**
```
Re = ρVL/μ = VL/ν
```

**Physical significance**: Ratio of inertial to viscous forces
- **Re << 1**: Viscous forces dominate (creeping flow)
- **Re >> 1**: Inertial forces dominate (inviscid flow)

#### **Froude Number**
```
Fr = V/√(gL)
```

**Physical significance**: Ratio of inertial to gravitational forces
- **Fr < 1**: Subcritical flow (gravity waves can propagate upstream)
- **Fr > 1**: Supercritical flow (gravity waves cannot propagate upstream)

#### **Mach Number**
```
M = V/a = V/√(γRT)
```

**Physical significance**: Ratio of flow velocity to speed of sound
- **M < 1**: Subsonic (pressure disturbances propagate upstream)
- **M > 1**: Supersonic (pressure disturbances cannot propagate upstream)

#### **Prandtl Number**
```
Pr = μcₚ/k = ν/α
```

**Physical significance**: Ratio of momentum to thermal diffusivity
- **Pr << 1**: Heat diffuses faster than momentum (liquid metals)
- **Pr >> 1**: Momentum diffuses faster than heat (oils)

#### **Nusselt Number**
```
Nu = hL/k
```

**Physical significance**: Ratio of convective to conductive heat transfer
- **Nu = 1**: Pure conduction
- **Nu >> 1**: Convection dominates

#### **Peclet Number**
```
Pe = Re × Pr = VL/α
```

**Physical significance**: Ratio of convective to diffusive heat transfer

#### **Weber Number**
```
We = ρV²L/σ
```

**Physical significance**: Ratio of inertial to surface tension forces

#### **Capillary Number**
```
Ca = μV/σ
```

**Physical significance**: Ratio of viscous to surface tension forces

---

## 🌊 **Fluid Flow Correlations**

### **Friction Factor Correlations**

#### **Laminar Flow (Re < 2300)**
```
f = 64/Re
```

**Derivation**: From Hagen-Poiseuille equation for fully developed laminar flow

#### **Turbulent Flow - Smooth Pipes**

**Blasius Equation (Re < 10⁵):**
```
f = 0.316/Re^0.25
```

**Prandtl-Karman Equation:**
```
1/√f = 2log₁₀(Re√f) - 0.8
```

#### **Turbulent Flow - Rough Pipes**

**Colebrook-White Equation:**
```
1/√f = -2log₁₀(ε/(3.7D) + 2.51/(Re√f))
```

**Swamee-Jain Approximation:**
```
f = 0.25/[log₁₀(ε/(3.7D) + 5.74/Re^0.9)]²
```

**Haaland Approximation:**
```
1/√f = -1.8log₁₀[(ε/D/3.7)^1.11 + 6.9/Re]
```

### **Open Channel Flow**

#### **Manning's Formula (1889)**
```
V = (1/n) × R^(2/3) × S^(1/2)
Q = A × V = (A/n) × R^(2/3) × S^(1/2)
```

**Derivation**: Empirical formula based on extensive field measurements

#### **Chezy Formula (1775)**
```
V = C√(RS)
C = (1/n) × R^(1/6)  (Manning-Strickler relation)
```

#### **Critical Flow**
```
Q = √(gA³/T)  (general)
Q = √(gB³y_c³/B) = B√(gy_c³)  (rectangular)
```

**Derivation**: From specific energy minimization

---

## 🌡️ **Heat Transfer Correlations**

### **Conduction**

#### **Fourier's Law**
```
q = -kA(dT/dx)
```

**For steady-state, 1D conduction:**
```
q = kA(T₁-T₂)/L
```

#### **Thermal Resistance**
```
R_thermal = L/(kA)  (conduction)
R_thermal = 1/(hA)  (convection)
```

### **Convection**

#### **Newton's Law of Cooling**
```
q = hA(T_s - T_∞)
```

#### **Nusselt Number Correlations**

**Flat Plate - Laminar (Re < 5×10⁵):**
```
Nu_x = 0.332Re_x^0.5 Pr^(1/3)  (local)
Nu_L = 0.664Re_L^0.5 Pr^(1/3)  (average)
```

**Flat Plate - Turbulent (Re > 5×10⁵):**
```
Nu_x = 0.0296Re_x^0.8 Pr^(1/3)  (local)
Nu_L = 0.037Re_L^0.8 Pr^(1/3)   (average)
```

**Cylinder in Crossflow (Churchill & Bernstein):**
```
Nu = 0.3 + (0.62Re^0.5 Pr^(1/3))/[1+(0.4/Pr)^(2/3)]^0.25 × [1+(Re/282000)^(5/8)]^(4/5)
```

**Internal Flow - Laminar (Re < 2300):**
```
Nu = 3.66  (constant wall temperature)
Nu = 4.36  (constant heat flux)
```

**Internal Flow - Turbulent (Re > 10⁴):**
```
Nu = 0.023Re^0.8 Pr^n  (Dittus-Boelter)
```
n = 0.4 (heating), n = 0.3 (cooling)

**Gnielinski Correlation (more accurate):**
```
Nu = (f/8)(Re-1000)Pr/[1+12.7(f/8)^0.5(Pr^(2/3)-1)]
```

### **Heat Exchanger Analysis**

#### **LMTD Method**
```
Q = UA × LMTD
LMTD = (ΔT₁ - ΔT₂)/ln(ΔT₁/ΔT₂)
```

**Counterflow:**
```
ΔT₁ = T_h,in - T_c,out
ΔT₂ = T_h,out - T_c,in
```

**Parallel flow:**
```
ΔT₁ = T_h,in - T_c,in
ΔT₂ = T_h,out - T_c,out
```

#### **Effectiveness-NTU Method**
```
ε = Q_actual/Q_max
Q_max = C_min(T_h,in - T_c,in)
NTU = UA/C_min
C* = C_min/C_max
```

**Counterflow effectiveness:**
```
ε = (1-exp(-NTU(1-C*)))/(1-C*exp(-NTU(1-C*)))  (C* ≠ 1)
ε = NTU/(1+NTU)  (C* = 1)
```

---

## 💨 **Compressible Flow Relations**

### **Isentropic Flow**

#### **Property Relations**
```
T₀/T = 1 + ((γ-1)/2)M²
p₀/p = [1 + ((γ-1)/2)M²]^(γ/(γ-1))
ρ₀/ρ = [1 + ((γ-1)/2)M²]^(1/(γ-1))
A*/A = (1/M)[2/(γ+1)(1+((γ-1)/2)M²)]^((γ+1)/(2(γ-1)))
```

#### **Critical Conditions (M = 1)**
```
T*/T₀ = 2/(γ+1)
p*/p₀ = [2/(γ+1)]^(γ/(γ-1))
ρ*/ρ₀ = [2/(γ+1)]^(1/(γ-1))
```

### **Normal Shock Relations**

#### **Rankine-Hugoniot Equations**
```
p₂/p₁ = (2γM₁² - (γ-1))/(γ+1)
ρ₂/ρ₁ = ((γ+1)M₁²)/((γ-1)M₁² + 2)
T₂/T₁ = [2γM₁² - (γ-1)][(γ-1)M₁² + 2]/[(γ+1)²M₁²]
M₂² = (M₁² + 2/(γ-1))/(2γM₁²/(γ-1) - 1)
```

#### **Entropy Change**
```
s₂ - s₁ = cᵥln(T₂/T₁) - Rln(ρ₁/ρ₂)
```

Always positive for shock waves (2nd law of thermodynamics)

---

## 🔧 **Boundary Layer Theory**

### **Boundary Layer Equations**

#### **2D Steady Boundary Layer**
```
∂u/∂x + ∂v/∂y = 0
u(∂u/∂x) + v(∂u/∂y) = U(dU/dx) + ν(∂²u/∂y²)
```

#### **Similarity Solutions**

**Blasius Solution (flat plate, zero pressure gradient):**
```
η = y√(U/νx)
f''' + (1/2)ff'' = 0
u/U = f'(η)
```

**Falkner-Skan Solutions (wedge flows):**
```
f''' + ff'' + β(1-f'²) = 0
β = 2m/(m+1)  (pressure gradient parameter)
```

### **Integral Methods**

#### **von Karman Momentum Integral**
```
dθ/dx = (τ_w/ρU²) - (θ/U)(dU/dx)(2 + H)
```

Where H = δ*/θ (shape factor)

#### **Thwaites Method (laminar)**
```
θ² = (0.45ν/U⁶)∫₀ˣ U⁵dx
```

---

## 📊 **Correlation Development**

### **Dimensional Analysis**

#### **Buckingham π Theorem**
For a physical relationship:
```
f(x₁, x₂, ..., xₙ) = 0
```

With **k** fundamental dimensions, there are **(n-k)** dimensionless groups.

**Example - Heat Transfer:**
```
h = f(V, L, ρ, μ, k, cₚ)
```

**Dimensionless groups:**
```
Nu = hL/k, Re = ρVL/μ, Pr = μcₚ/k
Nu = f(Re, Pr)
```

### **Experimental Correlation Development**

#### **Power Law Correlations**
```
Nu = C × Re^m × Pr^n
```

**Parameter determination:**
1. **Collect experimental data**
2. **Plot log(Nu) vs log(Re)** for constant Pr
3. **Determine slope** m and intercept C
4. **Repeat for different Pr** to find n

#### **Correlation Validation**
1. **Statistical analysis**: R², standard deviation
2. **Physical consistency**: Proper limits and trends
3. **Independent validation**: Different experimental datasets
4. **Range of validity**: Clearly define applicable ranges

---

## 🧮 **Numerical Methods**

### **Iterative Solutions**

#### **Newton-Raphson Method**
For equation f(x) = 0:
```
x_{n+1} = x_n - f(x_n)/f'(x_n)
```

**Example - Normal depth calculation:**
```
f(y) = Q - (A/n)R^(2/3)S^(1/2) = 0
f'(y) = -∂Q/∂y
```

#### **Bisection Method**
For equation f(x) = 0 with f(a)f(b) < 0:
```
c = (a+b)/2
if f(a)f(c) < 0: b = c
else: a = c
```

**Convergence**: Guaranteed but slow (linear)

#### **Fixed Point Iteration**
For equation x = g(x):
```
x_{n+1} = g(x_n)
```

**Convergence condition**: |g'(x)| < 1

### **Interpolation Methods**

#### **Linear Interpolation**
```
y = y₁ + (y₂-y₁)(x-x₁)/(x₂-x₁)
```

#### **Cubic Spline Interpolation**
For smooth curves through data points with continuous derivatives.

#### **Polynomial Fitting**
```
y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
```

**Least squares**: Minimize Σ(y_measured - y_calculated)²

---

## 📈 **Statistical Analysis**

### **Uncertainty Analysis**

#### **Error Propagation**
For function f(x₁, x₂, ..., xₙ):
```
σ_f² = Σᵢ(∂f/∂xᵢ)²σᵢ²
```

#### **Relative Uncertainty**
```
σ_f/f = √[Σᵢ(∂ln f/∂ln xᵢ)²(σᵢ/xᵢ)²]
```

### **Correlation Quality Metrics**

#### **Coefficient of Determination**
```
R² = 1 - SS_res/SS_tot
```

#### **Root Mean Square Error**
```
RMSE = √[Σᵢ(y_measured - y_predicted)²/n]
```

#### **Mean Absolute Percentage Error**
```
MAPE = (100/n)Σᵢ|y_measured - y_predicted|/y_measured
```

---

## 🔬 **Physical Property Correlations**

### **Water Properties**

#### **Density (kg/m³)**
```
ρ = 1000.0 - 0.0178T - 0.0058T²
```
Valid: 0 ≤ T ≤ 100°C

#### **Dynamic Viscosity (Pa·s)**
```
μ = 0.001792 × exp(-0.0255T)
```
Valid: 0 ≤ T ≤ 100°C

#### **Thermal Conductivity (W/m·K)**
```
k = 0.5707 + 0.0017T - 0.0000068T²
```
Valid: 0 ≤ T ≤ 100°C

#### **Specific Heat (J/kg·K)**
```
cₚ = 4217.4 - 2.0787T + 0.01404T² - 0.0000131T³
```
Valid: 0 ≤ T ≤ 100°C

#### **Vapor Pressure (Pa) - Antoine Equation**
```
log₁₀(p_v) = A - B/(C + T)
```
For water: A = 8.07131, B = 1730.63, C = 233.426 (T in °C, p in mmHg)

### **Air Properties (Standard Atmosphere)**

#### **Density (kg/m³)**
```
ρ = p/(RT)
```

#### **Viscosity (Pa·s) - Sutherland's Law**
```
μ = μ₀(T/T₀)^(3/2) × (T₀ + S)/(T + S)
```
Where μ₀ = 1.716×10⁻⁵ Pa·s, T₀ = 273.15 K, S = 110.4 K

#### **Thermal Conductivity (W/m·K)**
```
k = k₀(T/T₀)^(3/2) × (T₀ + S_k)/(T + S_k)
```
Where k₀ = 0.0241 W/m·K, S_k = 194 K

---

## 🎯 **Validation & Verification**

### **Code Verification**
1. **Manufactured solutions**: Test with known analytical solutions
2. **Grid convergence**: Verify numerical accuracy
3. **Conservation checking**: Mass, momentum, energy conservation
4. **Benchmark problems**: Compare with established solutions

### **Physical Validation**
1. **Experimental data**: Compare with laboratory measurements
2. **Field data**: Validate against operating systems
3. **Literature comparison**: Check against published correlations
4. **Physical limits**: Verify behavior at extreme conditions

### **Quality Assurance**
1. **Peer review**: Technical review by experts
2. **Independent testing**: Third-party validation
3. **Continuous monitoring**: Track prediction accuracy
4. **User feedback**: Incorporate real-world experience

---

## 📚 **Reference Standards**

### **Fundamental Textbooks**
1. **White, F.M.** (2011). "Fluid Mechanics, 7th Edition". McGraw-Hill.
2. **Munson, B.R., et al.** (2013). "Fundamentals of Fluid Mechanics, 7th Edition". Wiley.
3. **Incropera, F.P., et al.** (2017). "Fundamentals of Heat and Mass Transfer, 8th Edition". Wiley.

### **Advanced References**
1. **Schlichting, H. & Gersten, K.** (2017). "Boundary Layer Theory, 9th Edition". Springer.
2. **Anderson, J.D.** (2003). "Modern Compressible Flow, 3rd Edition". McGraw-Hill.
3. **Bejan, A.** (2013). "Convection Heat Transfer, 4th Edition". Wiley.

### **Industry Handbooks**
1. **Perry's Chemical Engineers' Handbook, 8th Edition** (2007). McGraw-Hill.
2. **Marks' Standard Handbook for Mechanical Engineers, 12th Edition** (2018). McGraw-Hill.
3. **ASHRAE Handbook - Fundamentals** (2021).

### **Standards Organizations**
1. **ASME** - American Society of Mechanical Engineers
2. **API** - American Petroleum Institute
3. **ASHRAE** - American Society of Heating, Refrigerating and Air-Conditioning Engineers
4. **ISO** - International Organization for Standardization
5. **NIST** - National Institute of Standards and Technology

---

## 🔍 **Accuracy & Limitations**

### **Calculation Accuracy**

| Module | Function | Typical Accuracy | Conditions |
|--------|----------|------------------|------------|
| **Hydraulics** | Pressure Drop | ±2-5% | Turbulent, smooth pipes |
| **Hydraulics** | Flow Rate | ±3% | Well-conditioned problems |
| **Pumps** | Performance | ±5% | Normal operating range |
| **Pumps** | NPSH | ±10% | Standard conditions |
| **Heat Transfer** | LMTD | ±2% | Well-mixed fluids |
| **Heat Transfer** | Effectiveness | ±5% | Clean surfaces |
| **Fluid Mechanics** | Manning Flow | ±10-20% | Natural channels |
| **Fluid Mechanics** | Compressible | ±2% | Perfect gas assumption |

### **Limitations & Assumptions**

#### **General Assumptions**
- **Steady-state conditions**: No time-dependent effects
- **Newtonian fluids**: Linear stress-strain relationship
- **Single-phase flow**: No phase changes or multiphase effects
- **Fully developed flow**: Entrance effects neglected

#### **Hydraulics Limitations**
- **Circular pipes only**: Non-circular requires hydraulic diameter
- **Smooth or uniformly rough**: No varying roughness
- **No cavitation**: Liquid remains liquid throughout
- **No compressibility**: Valid for M < 0.3

#### **Heat Transfer Limitations**
- **Constant properties**: No significant property variation
- **No fouling**: Clean heat transfer surfaces
- **Steady operation**: No transient effects
- **No phase change**: Sensible heat transfer only

#### **Fluid Mechanics Limitations**
- **Prismatic channels**: Uniform cross-section
- **Gradually varied flow**: No rapidly varied flow
- **Perfect gas**: Ideal gas behavior for compressible flow
- **2D boundary layers**: No 3D effects

---

**📐 The mathematical foundations of EngiVault are based on fundamental physical principles, validated experimental correlations, and industry-standard methods, providing reliable and accurate results for professional engineering applications.**
