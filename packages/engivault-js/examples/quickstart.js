/**
 * EngiVault JavaScript SDK - Quick Start
 * 
 * This example shows the simplest way to use EngiVault.
 * Just 5 lines to get started!
 */

const ev = require('engivault');

// 1. Initialize (reads API key from ENGIVAULT_API_KEY env var, or pass it directly)
ev.init('your-api-key-here');  // or ev.init() to use environment variable

// 2. Call any function directly
async function quickStart() {
  try {
    const result = await ev.pressureDrop({
      flowRate: 0.01,        // m³/s
      pipeDiameter: 0.1,     // m
      pipeLength: 100,       // m
      fluidDensity: 1000,    // kg/m³ (water)
      fluidViscosity: 0.001  // Pa·s (water at 20°C)
    });
    
    // 3. Use the results
    console.log(`Pressure drop: ${result.pressureDrop.toFixed(2)} Pa`);
    console.log(`Velocity: ${result.velocity.toFixed(2)} m/s`);
    console.log(`Reynolds number: ${result.reynoldsNumber.toFixed(0)}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// That's it! Just 3 simple steps.

// More examples:
async function moreExamples() {
  try {
    // Pump power
    const pumpResult = await ev.pumpPower({
      flowRate: 0.05,    // m³/s
      head: 50,          // m
      efficiency: 0.8    // 80%
    });
    console.log(`\nPump shaft power: ${(pumpResult.shaftPower/1000).toFixed(2)} kW`);
    
    // Heat exchanger LMTD
    const lmtdResult = await ev.lmtd({
      tHotIn: 373,       // K (100°C)
      tHotOut: 323,      // K (50°C)
      tColdIn: 293,      // K (20°C)
      tColdOut: 333      // K (60°C)
    });
    console.log(`\nLMTD: ${lmtdResult.lmtd.toFixed(2)} K`);
    
    // Open channel flow
    const channelResult = await ev.openChannelFlow({
      flowRate: 10.0,        // m³/s
      channelWidth: 5.0,     // m
      channelSlope: 0.001,   // dimensionless
      manningSCoeff: 0.03    // Manning's n
    });
    console.log(`\nNormal depth: ${channelResult.normalDepth.toFixed(3)} m`);
    console.log(`Flow regime: ${channelResult.flowRegime}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples
quickStart().then(() => moreExamples());

