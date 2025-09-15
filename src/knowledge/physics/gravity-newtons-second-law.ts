export const gravityNewtonsSecondLaw = {
  id: 'gravity-newtons-second-law',
  title: 'Acceleration of Gravity and Newton\'s Second Law',
  category: 'physics' as const,
  difficulty: 'beginner' as const,
  readTime: '12 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Gravity', 'Newton\'s Laws', 'Free Fall', 'Physics', 'Acceleration'],
  summary: 'Comprehensive guide to gravitational acceleration, Newton\'s Second Law, and free fall motion with interactive data tables and location-based gravity variations.',
  
  content: `
# Acceleration of Gravity and Newton's Second Law

## Newton's Second Law

Newton's Second Law of Motion states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. This fundamental principle is expressed mathematically as:

**F = ma**

Where:
- F = Force (N)
- m = Mass (kg)  
- a = Acceleration (m/s²)

## Acceleration Due to Gravity

The acceleration due to gravity (g) is the acceleration experienced by objects in free fall near Earth's surface. The standard value is approximately 9.81 m/s², but this varies slightly depending on location due to Earth's rotation and shape.

**g = 9.81 m/s²** (Standard gravitational acceleration at sea level)

### Key Characteristics:
- Independent of object mass - all objects fall at the same rate in vacuum
- Varies with altitude - decreases with height above sea level
- Varies with latitude - stronger at poles, weaker at equator
- Affected by local geological features and mass distributions

## Gravity Variations by Location

Earth's gravitational acceleration varies with geographic location due to the planet's rotation and oblate shape:

| Location | Latitude | Acceleration of Gravity (m/s²) |
|----------|----------|--------------------------------|
| North Pole | 90° 0' | 9.8321 |
| Anchorage | 61° 10' | 9.8218 |
| Greenwich | 51° 29' | 9.8119 |
| Paris | 48° 50' | 9.8094 |
| Washington | 38° 53' | 9.8011 |
| Panama | 8° 55' | 9.7822 |
| Equator | 0° 0' | 9.7799 |

### Why Does Gravity Vary?
- **Earth's Shape:** Earth is an oblate spheroid, flatter at the poles
- **Centrifugal Force:** Earth's rotation creates outward force, strongest at equator
- **Distance from Center:** Equatorial regions are farther from Earth's center
- **Local Geology:** Dense rock formations can increase local gravity

## Free Fall Motion

Free fall is the motion of objects under the influence of gravity alone, without air resistance. The following equations describe free fall motion:

### Velocity Equation
**v = gt**
Where v = velocity, g = 9.81 m/s², t = time

### Distance Equation  
**d = 0.5gt²**
Where d = distance, g = 9.81 m/s², t = time

## Free Fall Data Table

| Time (s) | Velocity (m/s) | Velocity (km/h) | Velocity (ft/s) | Velocity (mph) | Distance (m) | Distance (ft) |
|----------|----------------|-----------------|-----------------|----------------|--------------|---------------|
| 1 | 9.8 | 35.3 | 32.2 | 21.9 | 4.9 | 16.1 |
| 2 | 19.6 | 70.6 | 64.3 | 43.8 | 19.6 | 64.3 |
| 3 | 29.4 | 106 | 96.5 | 65.8 | 44.1 | 144.8 |
| 4 | 39.2 | 141 | 128.7 | 87.7 | 78.5 | 257.4 |
| 5 | 49.1 | 177 | 160.9 | 110 | 122.6 | 402.2 |
| 6 | 58.9 | 212 | 193 | 132 | 176.6 | 579.1 |
| 7 | 68.7 | 247 | 225.2 | 154 | 240.3 | 788.3 |
| 8 | 78.5 | 283 | 257.4 | 176 | 313.9 | 1029.6 |
| 9 | 88.3 | 318 | 289.6 | 198 | 397.3 | 1303 |
| 10 | 98.1 | 353 | 321.7 | 219 | 490.5 | 1608.7 |

## Practical Applications

Understanding gravity and Newton's Second Law is crucial in many engineering applications:

### Structural Engineering
- Calculating dead loads and live loads on structures
- Designing foundations and support systems
- Seismic analysis and earthquake resistance

### Mechanical Systems
- Elevator and lift system design
- Conveyor belt and material handling
- Automotive braking and acceleration systems

### Fluid Systems
- Hydrostatic pressure calculations
- Pump sizing and head calculations
- Drainage and sewer system design

### Safety Engineering
- Fall protection system design
- Impact force calculations
- Emergency evacuation planning

## Related Calculators
- Newton's Second Law Calculator
- Free Fall Calculator
- Kinematics Calculator
`,

  relatedCalculators: ['newtons-second-law', 'free-fall', 'kinematics'],
  lastUpdated: '2024-01-15',
};
