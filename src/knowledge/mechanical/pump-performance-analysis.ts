export const pumpPerformanceAnalysis = {
  id: 'pump-performance-analysis',
  title: 'Pump Performance Analysis and Selection',
  category: 'mechanical' as const,
  difficulty: 'intermediate' as const,
  readTime: '14 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Pump Performance', 'NPSH', 'Efficiency', 'Selection'],
  summary: 'Comprehensive guide to pump performance analysis including NPSH calculations, efficiency optimization, and pump selection criteria.',
  
  content: `
# Pump Performance Analysis and Selection

## Introduction

Pump performance analysis is essential for selecting the right pump for specific applications and ensuring optimal system operation. Understanding pump characteristics, efficiency, and operating limits is crucial for energy efficiency and system reliability.

This guide covers pump performance curves, NPSH analysis, efficiency optimization, and practical selection criteria for various applications.

## Pump Performance Curves

### Head-Flow Characteristics
- **Head (H):** Energy imparted to fluid per unit weight (m)
- **Flow Rate (Q):** Volume flow rate (m³/s or L/s)
- **Relationship:** Head decreases as flow increases (typically)

### Power Characteristics
- **Input Power (P):** Electrical power consumed (W)
- **Hydraulic Power:** Pₕ = ρgQH
- **Efficiency:** η = (Pₕ/P) × 100%

### Efficiency Curves
- Peak efficiency occurs at Best Efficiency Point (BEP)
- Efficiency decreases at off-design conditions
- Important for energy optimization

## Net Positive Suction Head (NPSH)

### NPSH Available (NPSHa)
Total head available at pump suction:

**NPSHa = Pₛₜₐₜᵢ𝒸/ρg + Pᵥₑₗₒ𝒸ᵢₜᵧ²/2g + Pₐₜₘ/ρg - Pᵥₐₚₒᵤᵣ/ρg**

Where:
- Pₛₜₐₜᵢ𝒸 = Static pressure at suction
- Pᵥₑₗₒ𝒸ᵢₜᵧ = Velocity head
- Pₐₜₘ = Atmospheric pressure
- Pᵥₐₚₒᵤᵣ = Vapor pressure

### NPSH Required (NPSHr)
Minimum head required to prevent cavitation:
- Provided by pump manufacturer
- Increases with flow rate
- Depends on pump design and speed

### Safety Margin
**NPSHa ≥ NPSHr + Safety Factor**

Typical safety factors:
- **Centrifugal pumps:** 0.5-1.0 m (1.5-3.0 ft)
- **High-speed pumps:** 1.0-2.0 m (3.0-6.0 ft)
- **Critical applications:** 2.0+ m (6.0+ ft)

## Pump Types and Characteristics

### Centrifugal Pumps
**Advantages:**
- Simple construction and maintenance
- Wide range of flow rates
- Smooth, continuous flow
- Good for clean liquids

**Disadvantages:**
- Lower efficiency at high heads
- Sensitive to viscosity changes
- Requires priming

**Applications:** Water supply, HVAC, general industrial use

### Positive Displacement Pumps
**Advantages:**
- Constant flow regardless of pressure
- High efficiency
- Good for viscous fluids
- Self-priming capability

**Disadvantages:**
- Pulsating flow
- Higher maintenance requirements
- Limited to clean liquids

**Applications:** Chemical processing, metering, high-pressure applications

### Axial Flow Pumps
**Advantages:**
- High flow rates
- Low head requirements
- Compact design

**Disadvantages:**
- Limited head capability
- Sensitive to system changes

**Applications:** Irrigation, flood control, large volume transfer

## Efficiency Optimization

### Operating Point Selection
- Select pump to operate near BEP
- Consider duty point requirements
- Account for system curve changes

### Variable Speed Operation
- Use VFDs for flow control
- Significant energy savings at reduced flows
- Follow affinity laws for performance prediction

### Multiple Pump Operation
**Parallel Operation:**
- Increases flow at constant head
- Useful for variable demand
- Consider pump interaction effects

**Series Operation:**
- Increases head at constant flow
- Used for high head requirements
- Ensure pump compatibility

## Pump Selection Criteria

### System Requirements
1. **Flow Rate**
   - Maximum, normal, and minimum flows
   - Consider future expansion
   - Account for system losses

2. **Head Requirements**
   - Static head (elevation difference)
   - Friction losses in piping
   - Pressure requirements at discharge

3. **Fluid Properties**
   - Density and viscosity
   - Temperature and pressure
   - Corrosion and abrasion characteristics

### Performance Considerations
1. **Efficiency**
   - Target 70-80% efficiency at design point
   - Consider part-load efficiency
   - Evaluate total life cycle cost

2. **NPSH Requirements**
   - Ensure adequate NPSH margin
   - Consider temperature effects
   - Account for suction piping losses

3. **Reliability**
   - Mean time between failures (MTBF)
   - Maintenance requirements
   - Spare parts availability

## Practical Selection Process

### Step 1: Define System Requirements
- Flow rate range and duty point
- Total head requirements
- Fluid properties and operating conditions
- Space and installation constraints

### Step 2: Preliminary Sizing
- Calculate required flow and head
- Add safety factors (10-20%)
- Consider system curve characteristics

### Step 3: Pump Type Selection
- Evaluate centrifugal vs. positive displacement
- Consider special requirements (self-priming, etc.)
- Review efficiency and cost trade-offs

### Step 4: Specific Pump Selection
- Review manufacturer performance curves
- Verify NPSH requirements
- Check efficiency at operating point
- Consider maintenance and support

### Step 5: System Integration
- Design suction and discharge piping
- Select motors and controls
- Plan installation and maintenance

## Common Selection Errors

### Oversizing
**Problems:**
- Poor efficiency at operating point
- Higher energy costs
- Potential cavitation at low flows
- Increased maintenance

**Solutions:**
- Size pump for design point
- Consider variable speed drives
- Use multiple smaller pumps

### Undersizing
**Problems:**
- Inability to meet flow requirements
- Operating away from BEP
- Potential motor overload

**Solutions:**
- Add appropriate safety factors
- Consider future expansion needs
- Verify system curve calculations

### NPSH Issues
**Problems:**
- Cavitation and damage
- Reduced performance
- Noise and vibration

**Solutions:**
- Calculate NPSH accurately
- Add adequate safety margin
- Consider pump location and elevation

## Maintenance Considerations

### Regular Maintenance
- Bearing lubrication and replacement
- Seal inspection and replacement
- Impeller cleaning and balancing
- Alignment checks

### Performance Monitoring
- Flow and pressure measurements
- Power consumption monitoring
- Vibration analysis
- Temperature monitoring

### Troubleshooting
- Low flow: Check system resistance, impeller wear
- High power: Check alignment, bearing condition
- Vibration: Check balance, alignment, foundation
- Cavitation: Check NPSH, suction conditions

## Related Calculators
- Pump Performance Calculator
- NPSH Calculator
- Pump Selection Calculator
`,

  relatedCalculators: ['pump-performance', 'npsh', 'pump-selection'],
  lastUpdated: '2024-01-15',
};
