// Test the pressure drop sizing calculation
const flow = 0.1; // m³/s
const targetPressureDrop = 10000; // Pa
const length = 100; // m
const roughness = 0.000045; // m
const density = 998; // kg/m³
const viscosity = 0.001002; // Pa·s

// Test the initial diameter estimate
const assumedFrictionFactor = 0.02;
const diameterEstimate = Math.pow(assumedFrictionFactor * length * density * flow * flow / (Math.PI * Math.PI * targetPressureDrop), 0.2);

console.log('Flow:', flow, 'm³/s');
console.log('Target pressure drop:', targetPressureDrop, 'Pa');
console.log('Length:', length, 'm');
console.log('Density:', density, 'kg/m³');
console.log('Viscosity:', viscosity, 'Pa·s');
console.log('Assumed friction factor:', assumedFrictionFactor);
console.log('Initial diameter estimate:', diameterEstimate, 'm');

// Test the calculation inside the formula
const numerator = assumedFrictionFactor * length * density * flow * flow;
const denominator = Math.PI * Math.PI * targetPressureDrop;
const ratio = numerator / denominator;

console.log('Numerator:', numerator);
console.log('Denominator:', denominator);
console.log('Ratio:', ratio);
console.log('Ratio to 0.2 power:', Math.pow(ratio, 0.2));

// Test the calculatePressureDrop function
const diameter = diameterEstimate;
const area = Math.PI * diameter * diameter / 4;
const velocity = flow / area;
const reynoldsNumber = (density * velocity * diameter) / viscosity;

console.log('\n--- calculatePressureDrop test ---');
console.log('Diameter:', diameter, 'm');
console.log('Area:', area, 'm²');
console.log('Velocity:', velocity, 'm/s');
console.log('Reynolds number:', reynoldsNumber);

// Test the adjustment factor calculation
const pressureDrop = 5000; // Assume some pressure drop
const adjustmentFactor = Math.pow(targetPressureDrop / pressureDrop, 0.2);
console.log('Adjustment factor:', adjustmentFactor);
console.log('New diameter:', diameter * adjustmentFactor);
