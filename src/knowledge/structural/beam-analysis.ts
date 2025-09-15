export const beamAnalysis = {
  id: 'beam-analysis',
  title: 'Beam Analysis and Design Fundamentals',
  category: 'structural' as const,
  difficulty: 'intermediate' as const,
  readTime: '12 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Beam Analysis', 'Structural Design', 'Moment', 'Shear'],
  summary: 'Fundamentals of beam analysis including moment and shear force calculations, deflection analysis, and design considerations.',
  
  content: `
# Beam Analysis and Design Fundamentals

## Introduction

Beam analysis is a fundamental aspect of structural engineering that involves determining internal forces, moments, and deflections in structural members. Understanding beam behavior is essential for safe and efficient structural design in buildings, bridges, and mechanical systems.

This guide covers the basic principles of beam analysis, including moment and shear force calculations, deflection analysis, and practical design considerations.

## Types of Beams

### Simply Supported Beam
- Supported at both ends with pin and roller supports
- Most common beam type in construction
- Allows rotation but prevents vertical displacement at supports

### Cantilever Beam
- Fixed at one end, free at the other
- Common in balconies, overhangs, and machine elements
- Maximum moment occurs at the fixed end

### Fixed Beam
- Fixed at both ends against rotation and translation
- Higher stiffness than simply supported beams
- Reduces deflections but increases support moments

### Continuous Beam
- Supported at multiple points along its length
- More complex analysis but efficient use of material
- Common in multi-span bridges and buildings

## Load Types

### Point Loads
- Concentrated forces applied at specific locations
- Creates discontinuities in shear and moment diagrams
- Common in machine applications and concentrated loads

### Distributed Loads
- Forces spread over a length of the beam
- Can be uniform (constant) or varying
- Common in floor loads and wind loads

### Moment Loads
- Concentrated moments applied at specific points
- Creates discontinuities in moment diagrams
- Common in connections and eccentric loads

## Shear Force and Bending Moment

### Shear Force (V)
- Internal force perpendicular to beam axis
- Caused by transverse loads
- Measured in Newtons (N) or pounds (lb)

**Sign Convention:**
- Positive: Clockwise on left face, counterclockwise on right face
- Negative: Opposite of positive

### Bending Moment (M)
- Internal moment causing beam to bend
- Measured in Newton-meters (N·m) or foot-pounds (ft·lb)

**Sign Convention:**
- Positive: Compression on top, tension on bottom
- Negative: Tension on top, compression on bottom

## Analysis Methods

### Method of Sections
1. Cut the beam at the point of interest
2. Draw free body diagram of one segment
3. Apply equilibrium equations (ΣF = 0, ΣM = 0)
4. Solve for internal forces and moments

### Graphical Methods
- Use relationships between loads, shear, and moment
- dV/dx = -w (distributed load)
- dM/dx = V (shear force)
- d²M/dx² = -w (distributed load)

## Deflection Analysis

### Deflection Equations
For simply supported beams with common loading:

**Point Load at Center:**
δ = PL³/(48EI)

**Uniformly Distributed Load:**
δ = 5wL⁴/(384EI)

**Where:**
- δ = deflection (m)
- P = point load (N)
- w = distributed load (N/m)
- L = span length (m)
- E = modulus of elasticity (Pa)
- I = moment of inertia (m⁴)

### Deflection Limits
Common deflection limits for different applications:
- **Floors:** L/360 to L/240
- **Roofs:** L/240 to L/180
- **Cantilevers:** L/180 to L/120

## Design Considerations

### Strength Design
- Ensure maximum stress does not exceed allowable stress
- σ = Mc/I ≤ σallowable
- Consider both normal and shear stresses

### Serviceability Design
- Limit deflections to acceptable values
- Prevent excessive vibration
- Consider long-term creep effects

### Stability Considerations
- Check for lateral-torsional buckling
- Consider bracing requirements
- Evaluate support conditions

## Common Beam Configurations

### Standard Loading Cases

**Simply Supported with Point Load at Center:**
- Maximum moment: M = PL/4
- Maximum deflection: δ = PL³/(48EI)

**Simply Supported with Uniform Load:**
- Maximum moment: M = wL²/8
- Maximum deflection: δ = 5wL⁴/(384EI)

**Cantilever with Point Load at End:**
- Maximum moment: M = PL
- Maximum deflection: δ = PL³/(3EI)

**Cantilever with Uniform Load:**
- Maximum moment: M = wL²/2
- Maximum deflection: δ = wL⁴/(8EI)

## Material Properties for Beam Design

### Steel Beams
- High strength and stiffness
- Good ductility and toughness
- Standard shapes (I-beams, channels, angles)
- Easy to fabricate and erect

### Concrete Beams
- Good compressive strength
- Reinforced with steel for tension
- Fire resistant and durable
- Can be cast in place or precast

### Timber Beams
- Renewable and sustainable
- Good strength-to-weight ratio
- Easy to work with
- Requires protection from moisture and fire

## Practical Applications

### Building Construction
- Floor and roof framing
- Bridge girders
- Crane runways
- Equipment supports

### Mechanical Systems
- Machine tool beds
- Conveyor supports
- Pump foundations
- Structural frames

### Design Optimization
- Minimize weight while meeting strength requirements
- Optimize cross-sectional shape
- Consider manufacturing constraints
- Evaluate total cost including fabrication and erection

## Related Calculators
- Beam Analysis Calculator
- Moment and Shear Calculator
- Deflection Calculator
`,

  relatedCalculators: ['beam-analysis', 'moment-shear', 'deflection'],
  lastUpdated: '2024-01-15',
};
