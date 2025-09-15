export const accelerationFundamentals = {
  id: 'acceleration-fundamentals',
  title: 'Acceleration Fundamentals in Engineering',
  category: 'physics' as const,
  difficulty: 'beginner' as const,
  readTime: '8 min read',
  author: 'EngiVault Engineering Team',
  tags: ['Acceleration', 'Kinematics', 'Motion', 'Physics'],
  summary: 'Complete guide to acceleration concepts, calculations, and applications in mechanical systems with velocity-time relationships and practical examples.',
  
  content: `
# Acceleration Fundamentals in Engineering

## What is Acceleration?

Acceleration is the rate of change of velocity with respect to time. It's a fundamental concept in physics and engineering that describes how quickly an object's velocity changes. Understanding acceleration is crucial for analyzing motion in mechanical systems, vehicle dynamics, and many engineering applications.

**Key Definition:**
Acceleration (a) = Change in Velocity (Δv) / Change in Time (Δt)

**Units:** m/s² (meters per second squared) or ft/s²

## Mathematical Relationships

### Basic Equations

**Average Acceleration:**
a = (v₂ - v₁) / (t₂ - t₁)

**Velocity-Time:**
v = v₀ + at

**Position-Time:**
s = v₀t + ½at²

### Key Variables
- **a** = acceleration (m/s²)
- **v** = final velocity (m/s)
- **v₀** = initial velocity (m/s)
- **t** = time (s)
- **s** = displacement (m)

## Acceleration vs. Velocity and Time Relationship

The relationship between acceleration, velocity change, and time is fundamental to understanding motion. Higher velocity changes require higher initial acceleration, and all curves converge to lower acceleration values over time.

### Key Observations
- Higher velocity changes require higher initial acceleration
- All curves converge to lower acceleration values over time
- The reference line shows 1g = 9.81 m/s²
- Acceleration decreases exponentially with time

### Practical Applications
- Vehicle acceleration performance
- Elevator design and comfort
- Machinery startup sequences
- Safety factor calculations

## Types of Acceleration

### Linear Acceleration
Motion in a straight line where velocity changes at a constant rate.

### Angular Acceleration
Rate of change of angular velocity in rotational motion (rad/s²).

### Centripetal Acceleration
Acceleration directed toward the center of circular motion.

### Gravitational Acceleration
Standard gravity: g = 9.81 m/s² (32.2 ft/s²) at sea level.

## Engineering Applications

### Automotive
- Engine performance
- Braking systems
- Suspension design
- Safety testing

### Mechanical Systems
- Conveyor belts
- Rotating machinery
- Elevators
- Pumps and fans

### Structural
- Seismic analysis
- Dynamic loading
- Vibration control
- Impact resistance

## Quick Reference

| Application | Typical Acceleration |
|-------------|---------------------|
| Standard Gravity | 9.81 m/s² = 32.2 ft/s² |
| Typical Car Acceleration | 2-4 m/s² (0.2-0.4g) |
| Emergency Braking | 8-10 m/s² (0.8-1.0g) |
| Elevator Comfort | Less than 1.5 m/s² (less than 0.15g) |

## Related Calculators
- Kinematics Calculator
- Acceleration Calculator
- Motion Analysis Calculator
`,

  relatedCalculators: ['kinematics', 'acceleration', 'motion-analysis'],
  lastUpdated: '2024-01-15',
};
