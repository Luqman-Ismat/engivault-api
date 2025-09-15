export const coldWaterStorageDesign = {
  id: 'cold-water-storage-design',
  title: 'Cold Water Storage Design for Buildings',
  category: 'fluid' as const,
  difficulty: 'intermediate' as const,
  readTime: '12 min read',
  author: 'Luqman Ismat, Founder',
  tags: ['Water Storage', 'Building Services', 'Public Health', 'Storage Design'],
  summary: 'Requirements and guidelines from CIBSE Guide G (2004) for cold water storage capacities in various building types.',
  
  content: `
# Cold Water Storage Design for Buildings

## Introduction

Proper cold water storage design is fundamental to building services engineering, ensuring adequate water supply for all building occupants while maintaining water quality and system efficiency. This article presents the requirements and guidelines from CIBSE Guide G (2004) for cold water storage capacities in various building types.

Understanding these storage requirements is essential for designing reliable water supply systems that meet peak demand periods, accommodate supply interruptions, and comply with building regulations and health standards.

## Design Principles

### Storage Capacity Determination

Cold water storage capacity is determined by several factors including building type, occupancy patterns, fixture types, and local water supply reliability. The storage system must provide adequate capacity for:

- Peak demand periods during normal operation
- Emergency supply during mains water interruption
- Fire fighting reserve (where applicable)
- System maintenance and cleaning cycles

### Key Design Considerations

**Water Quality**
- Prevent stagnation and contamination through proper sizing and turnover rates

**System Reliability**
- Ensure continuous supply during peak demand and supply interruptions

**Energy Efficiency**
- Optimize pumping energy through appropriate storage sizing

**Space Utilization**
- Balance storage capacity with available building space

## Storage Capacity by Fixture Type

For residential and mixed-use buildings, storage capacity can be calculated based on the number and type of fixtures:

| Fixture Type | Storage (L) | Storage (gal) | Typical Usage |
|--------------|-------------|---------------|---------------|
| Basin | 90 | 24 | Single handwash |
| Bath | 900 | 238 | Full bath usage |
| Shower | 185 | 49 | Standard 5-8 min shower |
| WC | 180 | 48 | Single flush cycle |
| Kitchen Sink | 135 | 36 | Kitchen utility use |
| Garden Tap | 180 | 48 | 5 min irrigation |
| Urinal | 110 | 29 | Single flush |

### Fixture Analysis

**High Demand Fixtures:**
- Bath: 900L (238 gal) - Full bath usage
- Shower: 185L (49 gal) - Standard 5-8 min shower
- WC: 180L (48 gal) - Single flush cycle

**Medium Demand Fixtures:**
- Garden Tap: 180L (48 gal) - 5 min irrigation
- Kitchen Sink: 135L (36 gal) - Kitchen utility use
- Urinal: 110L (29 gal) - Single flush

**Low Demand Fixtures:**
- Basin: 90L (24 gal) - Single handwash
- Minimal water requirement
- Frequent but low volume usage

## Storage Capacity by Building Type

For commercial and institutional buildings, storage capacity is typically calculated on a per-person basis, accounting for different usage patterns and occupancy densities:

| Building Type | Storage per Person (L) | Storage per Person (gal) | Description |
|---------------|------------------------|---------------------------|-------------|
| Hotels | 135 | 36 | 24-hour occupancy with full amenities |
| Hostels | 90 | 24 | Shared facilities with basic amenities |
| Boarding Schools | 90 | 24 | Residential accommodation with educational facility requirements |
| Offices with Canteens | 45 | 12 | Daytime occupancy with food service and washroom facilities |
| Offices without Canteens | 40 | 11 | Basic washroom facilities and drinking water only |
| Restaurants | 7 | 2 | Calculated per meal served rather than occupancy |

### Building Type Analysis

**High Consumption Buildings:**
- Hotels: 135L (36 gal) per person - 24-hour occupancy with full amenities
- Hostels: 90L (24 gal) per person - Shared facilities with basic amenities
- Boarding Schools: 90L (24 gal) per person - Residential accommodation

**Lower Consumption Buildings:**
- Offices with Canteens: 45L (12 gal) per person - Daytime occupancy with food service
- Offices without Canteens: 40L (11 gal) per person - Basic washroom facilities only
- Restaurants: 7L (2 gal) per meal - Calculated per meal served

## Design Calculation Methods

### Method 1: Fixture-Based Calculation

For residential and mixed-use buildings, calculate total storage based on fixture inventory:

**Calculation Formula:**
Total Storage = Σ(Fixture Count × Storage per Fixture) + Safety Factor

**Example Calculation - Residential Unit:**
- 2 × Basin (90L each) = 180L
- 1 × Bath (900L) = 900L
- 1 × Shower (185L average) = 185L
- 2 × WC (180L each) = 360L
- 1 × Kitchen Sink (135L average) = 135L
- **Subtotal:** 1,760L + 20% Safety Factor = **2,112L**

### Method 2: Occupancy-Based Calculation

For commercial buildings, calculate based on occupancy and building type:

**Calculation Formula:**
Total Storage = Occupancy × Storage per Person × Peak Factor

**Example Calculation - Office Building:**
- Building Occupancy: 200 people
- Office with Canteen: 45L per person
- Peak Factor: 1.5 (for simultaneous use)
- **Total Storage:** 200 × 45L × 1.5 = **13,500L**

## Additional Design Considerations

### Water Quality Management

**Turnover Rate**
- Storage should turn over completely within 24-48 hours to prevent stagnation

**Temperature Control**
- Maintain water temperature below 20°C to prevent bacterial growth

**Tank Materials**
- Use food-grade materials and provide adequate access for cleaning

### System Reliability

**Redundancy**
- Consider multiple tanks or compartments for critical applications

**Emergency Supply**
- Provide 24-hour emergency storage for essential services

**Monitoring Systems**
- Install level indicators and alarms for operational monitoring

## Related Calculators
- Water Storage Calculator
- Building Services Calculator
- Storage Sizing Calculator
`,

  relatedCalculators: ['water-storage', 'building-services', 'storage-sizing'],
  lastUpdated: '2024-01-15',
};
