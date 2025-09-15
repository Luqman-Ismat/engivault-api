export const materialProperties = {
  id: 'material-properties',
  title: 'Engineering Material Properties and Selection',
  category: 'materials' as const,
  difficulty: 'intermediate' as const,
  readTime: '10 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Materials', 'Properties', 'Selection', 'Engineering'],
  summary: 'Comprehensive guide to engineering material properties including mechanical, thermal, and physical characteristics for design and selection.',
  
  content: `
# Engineering Material Properties and Selection

## Introduction

Material selection is a critical aspect of engineering design that directly impacts product performance, cost, and reliability. Understanding material properties and their relationships is essential for making informed decisions in structural design, thermal systems, and mechanical applications.

This guide covers the fundamental material properties used in engineering calculations and provides practical guidance for material selection across different applications.

## Key Material Properties

### Mechanical Properties

**Density (ρ)**
- Definition: Mass per unit volume (kg/m³)
- Importance: Affects weight, inertia, and structural performance
- Typical values: Steel (7870 kg/m³), Aluminum (2700 kg/m³), Wood (500-800 kg/m³)

**Elastic Modulus (E)**
- Definition: Ratio of stress to strain in elastic region (GPa)
- Importance: Determines stiffness and deflection behavior
- Typical values: Steel (200 GPa), Aluminum (70 GPa), Concrete (30 GPa)

**Poisson's Ratio (ν)**
- Definition: Ratio of lateral to longitudinal strain
- Importance: Affects volume changes under load
- Typical values: Most metals (0.25-0.35), Rubber (0.49), Cork (0.00)

**Tensile Strength (σt)**
- Definition: Maximum stress material can withstand (MPa)
- Importance: Determines load-carrying capacity
- Typical values: Steel (400-500 MPa), Aluminum (200-400 MPa), Concrete (3-5 MPa)

### Thermal Properties

**Thermal Conductivity (k)**
- Definition: Rate of heat transfer through material (W/m·K)
- Importance: Affects heat transfer and insulation
- Typical values: Copper (400 W/m·K), Steel (50 W/m·K), Wood (0.1 W/m·K)

**Specific Heat (c)**
- Definition: Heat required to raise temperature per unit mass (J/kg·K)
- Importance: Affects thermal energy storage
- Typical values: Water (4180 J/kg·K), Steel (450 J/kg·K), Aluminum (900 J/kg·K)

**Thermal Expansion Coefficient (α)**
- Definition: Change in length per degree temperature change (1/K)
- Importance: Affects dimensional stability
- Typical values: Steel (12×10⁻⁶ K⁻¹), Aluminum (23×10⁻⁶ K⁻¹), Concrete (10×10⁻⁶ K⁻¹)

## Material Categories

### Metals
**Steel**
- High strength and stiffness
- Good machinability and weldability
- Susceptible to corrosion
- Applications: Structures, machinery, automotive

**Aluminum**
- Low density and good strength-to-weight ratio
- Excellent corrosion resistance
- Good thermal and electrical conductivity
- Applications: Aerospace, automotive, packaging

**Copper**
- Excellent electrical and thermal conductivity
- Good corrosion resistance
- Antimicrobial properties
- Applications: Electrical systems, plumbing, heat exchangers

### Polymers
**Thermoplastics (PE, PP, PVC)**
- Lightweight and flexible
- Good chemical resistance
- Low thermal conductivity
- Applications: Piping, packaging, insulation

**Thermosets (Epoxy, Polyester)**
- High temperature resistance
- Good dimensional stability
- Difficult to recycle
- Applications: Composites, adhesives, coatings

### Ceramics
**Alumina (Al₂O₃)**
- High hardness and wear resistance
- Excellent electrical insulation
- Brittle and low toughness
- Applications: Cutting tools, electrical insulation

**Silicon Carbide (SiC)**
- Extremely high hardness
- Good thermal conductivity
- Excellent chemical resistance
- Applications: Abrasives, refractory materials

### Composites
**Carbon Fiber Reinforced Polymer (CFRP)**
- High strength-to-weight ratio
- Excellent fatigue resistance
- Expensive and difficult to repair
- Applications: Aerospace, automotive, sports equipment

**Glass Fiber Reinforced Polymer (GFRP)**
- Good strength and corrosion resistance
- Lower cost than carbon fiber
- Moderate stiffness
- Applications: Marine, automotive, construction

## Material Selection Process

### 1. Define Requirements
- Functional requirements (strength, stiffness, thermal)
- Environmental conditions (temperature, corrosion, wear)
- Manufacturing constraints (formability, machinability)
- Cost and availability considerations

### 2. Screen Materials
- Eliminate unsuitable materials
- Consider property ranges and limitations
- Check availability and cost
- Evaluate manufacturing compatibility

### 3. Rank and Select
- Use material indices for optimization
- Consider trade-offs between properties
- Evaluate total life cycle cost
- Perform detailed analysis for critical applications

## Material Property Relationships

### Ashby Plots
Material selection charts showing relationships between properties:
- Strength vs. Density
- Stiffness vs. Density
- Thermal Conductivity vs. Electrical Resistivity

### Material Indices
Performance indices for specific applications:
- **Lightweight structures:** E/ρ (stiffness per unit weight)
- **Thermal insulation:** 1/k (inverse thermal conductivity)
- **Heat exchangers:** k/ρ (thermal conductivity per unit weight)

## Practical Applications

### Structural Design
- Select materials based on strength and stiffness requirements
- Consider fatigue and fracture toughness
- Evaluate corrosion resistance for service environment

### Thermal Systems
- Choose materials for heat transfer efficiency
- Consider thermal expansion for thermal stress
- Select insulation materials for energy conservation

### Electrical Systems
- Select conductors for electrical conductivity
- Choose insulators for electrical isolation
- Consider electromagnetic compatibility

## Related Calculators
- Material Property Calculator
- Material Selection Calculator
- Thermal Analysis Calculator
`,

  relatedCalculators: ['material-properties', 'material-selection', 'thermal-analysis'],
  lastUpdated: '2024-01-15',
};
