/**
 * EngiVault TypeScript SDK - Quick Start
 * 
 * This example shows type-safe usage of EngiVault with TypeScript.
 */

import * as ev from 'engivault';

// Initialize with type safety
ev.init(process.env.ENGIVAULT_API_KEY || 'your-api-key-here');

async function quickStart(): Promise<void> {
  try {
    // Pressure drop with full type checking
    const result = await ev.pressureDrop({
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0.001
    });
    
    console.log(`Pressure drop: ${result.pressureDrop.toFixed(2)} Pa`);
    console.log(`Velocity: ${result.velocity.toFixed(2)} m/s`);
    
    // Pump power
    const pumpResult = await ev.pumpPower({
      flowRate: 0.05,
      head: 50,
      efficiency: 0.8
    });
    console.log(`\nPump power: ${(pumpResult.shaftPower/1000).toFixed(2)} kW`);
    
    // LMTD
    const lmtdResult = await ev.lmtd({
      tHotIn: 373,
      tHotOut: 323,
      tColdIn: 293,
      tColdOut: 333,
      flowArrangement: 'counterflow'
    });
    console.log(`\nLMTD: ${lmtdResult.lmtd.toFixed(2)} K`);
    
  } catch (error) {
    if (error instanceof ev.EngiVaultError) {
      console.error(`EngiVault Error [${error.code}]:`, error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

// Alternative: Traditional API with full client control
async function traditionalAPI(): Promise<void> {
  const client = new ev.EngiVault({
    apiKey: process.env.ENGIVAULT_API_KEY,
    timeout: 30000,
    retries: 3
  });
  
  try {
    const result = await client.fluidMechanics.openChannelFlow({
      flowRate: 10.0,
      channelWidth: 5.0,
      channelSlope: 0.001,
      manningSCoeff: 0.03,
      channelShape: 'rectangular'
    });
    
    console.log('\nTraditional API Result:');
    console.log(`Normal depth: ${result.normalDepth.toFixed(3)} m`);
    console.log(`Velocity: ${result.velocity.toFixed(3)} m/s`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
async function runAll() {
  await quickStart();
  await traditionalAPI();
}

runAll();

