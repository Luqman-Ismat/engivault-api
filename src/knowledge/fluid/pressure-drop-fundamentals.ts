export const pressureDropFundamentals = {
  id: 'pressure-drop-fundamentals',
  title: 'Pressure Drop Fundamentals in Pipe Systems',
  category: 'fluid' as const,
  difficulty: 'intermediate' as const,
  readTime: '10 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Pressure Drop', 'Pipe Flow', 'Hydraulics', 'Friction'],
  summary: 'Fundamentals of pressure drop calculations in pipe systems including friction factors, minor losses, and practical design considerations.',
  
  content: `
# Pressure Drop Fundamentals in Pipe Systems

## Introduction

Pressure drop is a critical parameter in fluid system design that affects pump selection, pipe sizing, and overall system performance. Understanding pressure drop calculations is essential for designing efficient and cost-effective fluid transport systems.

This guide covers the fundamental principles of pressure drop calculations, including major and minor losses, friction factors, and practical design considerations.

## Types of Pressure Losses

### Major Losses (Friction Losses)
- Pressure drop due to fluid friction along pipe walls
- Depends on pipe length, diameter, roughness, and flow conditions
- Calculated using Darcy-Weisbach equation

### Minor Losses (Local Losses)
- Pressure drop due to fittings, valves, and changes in flow direction
- Includes elbows, tees, reducers, valves, and other components
- Often expressed as equivalent length or loss coefficients

## Darcy-Weisbach Equation

The fundamental equation for calculating pressure drop in pipes:

**ΔP = f × (L/D) × (ρv²/2)**

Where:
- ΔP = pressure drop (Pa)
- f = Darcy friction factor (dimensionless)
- L = pipe length (m)
- D = pipe diameter (m)
- ρ = fluid density (kg/m³)
- v = average velocity (m/s)

## Friction Factor Determination

### Laminar Flow (Re < 2300)
**f = 64/Re**

Where Re is the Reynolds number: Re = ρvD/μ

### Turbulent Flow (Re > 4000)
Use Colebrook-White equation or Moody chart:

**1/√f = -2log₁₀[(ε/D)/3.7 + 2.51/(Re√f)]**

Where ε is the pipe roughness (m)

### Transitional Flow (2300 < Re < 4000)
Use interpolation or conservative approach with turbulent flow equations.

## Pipe Roughness Values

| Material | Roughness ε (mm) | Roughness ε (ft) |
|----------|------------------|------------------|
| Smooth pipes (glass, plastic) | 0.0015 | 0.000005 |
| Steel, wrought iron | 0.046 | 0.00015 |
| Cast iron | 0.26 | 0.00085 |
| Galvanized iron | 0.15 | 0.0005 |
| Asphalted cast iron | 0.12 | 0.0004 |
| Concrete | 0.3-3.0 | 0.001-0.01 |
| Riveted steel | 0.9-9.0 | 0.003-0.03 |

## Minor Losses

### Loss Coefficient Method
**ΔP = K × (ρv²/2)**

Common K values:
- Standard elbow (90°): K = 0.9
- Standard elbow (45°): K = 0.4
- Standard tee (flow through run): K = 0.2
- Standard tee (flow through branch): K = 1.8
- Gate valve (fully open): K = 0.2
- Globe valve (fully open): K = 10
- Check valve (swing): K = 2.5

### Equivalent Length Method
Convert minor losses to equivalent pipe length:

**Leq = K × D/f**

## Design Considerations

### Velocity Guidelines
Recommended velocities for different applications:
- **Water supply:** 1.5-3.0 m/s (5-10 ft/s)
- **Sewer systems:** 0.6-3.0 m/s (2-10 ft/s)
- **Steam:** 25-40 m/s (80-130 ft/s)
- **Air conditioning:** 3-8 m/s (10-25 ft/s)

### Pressure Drop Limits
Typical maximum pressure drops:
- **Water distribution:** 50-100 kPa per 100m (20-40 psi per 100ft)
- **Process piping:** 10-50 kPa per 100m (4-20 psi per 100ft)
- **HVAC systems:** 5-25 kPa per 100m (2-10 psi per 100ft)

## Calculation Methods

### Step-by-Step Procedure

1. **Determine fluid properties**
   - Density and viscosity at operating temperature
   - Flow rate and pipe diameter

2. **Calculate Reynolds number**
   - Re = ρvD/μ

3. **Determine friction factor**
   - Use appropriate equation based on flow regime

4. **Calculate major losses**
   - Use Darcy-Weisbach equation

5. **Calculate minor losses**
   - Sum all fitting losses

6. **Total pressure drop**
   - Sum major and minor losses

### Example Calculation

**Given:**
- Water flow: 50 L/s
- Pipe: 150mm steel pipe, 100m long
- Fittings: 4 elbows, 2 gate valves, 1 tee
- Water temperature: 20°C

**Solution:**
- Velocity: v = 2.83 m/s
- Reynolds number: Re = 424,000
- Friction factor: f = 0.018
- Major loss: ΔP = 48 kPa
- Minor losses: ΔP = 12 kPa
- **Total pressure drop: 60 kPa**

## Practical Applications

### Pump Sizing
- Calculate total system pressure drop
- Add safety factor (10-20%)
- Select pump with adequate head

### Pipe Sizing
- Balance pressure drop with cost
- Consider future expansion
- Maintain adequate velocities

### System Analysis
- Identify high-pressure drop sections
- Optimize for energy efficiency
- Consider parallel piping for large flows

## Energy Considerations

### Power Loss
Power lost due to pressure drop:
**P = Q × ΔP**

Where:
- P = power (W)
- Q = flow rate (m³/s)
- ΔP = pressure drop (Pa)

### Optimization Strategies
- Increase pipe diameter to reduce velocity
- Minimize number of fittings
- Use smooth pipes where possible
- Consider variable speed pumps

## Related Calculators
- Pressure Drop Calculator
- Pipe Sizing Calculator
- Friction Factor Calculator
`,

  relatedCalculators: ['pressure-drop', 'pipe-sizing', 'friction-factor'],
  lastUpdated: '2024-01-15',
};
