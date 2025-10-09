/**
 * EngiVault JavaScript SDK - Batch Processing
 * 
 * Example of processing multiple calculations efficiently
 */

const ev = require('engivault');

ev.init(process.env.ENGIVAULT_API_KEY || 'your-api-key-here');

async function batchPressureDrop() {
  console.log('Batch Pressure Drop Analysis');
  console.log('='.repeat(60));
  
  const pipeDiameters = [0.05, 0.08, 0.1, 0.15, 0.2];  // meters
  const flowRate = 0.01;  // m³/s
  
  console.log(`\nFlow rate: ${flowRate} m³/s, Length: 100 m\n`);
  console.log('Diameter (m)   Velocity (m/s)   Pressure Drop (kPa)');
  console.log('-'.repeat(60));
  
  const promises = pipeDiameters.map(diameter => 
    ev.pressureDrop({
      flowRate,
      pipeDiameter: diameter,
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0.001
    }).then(result => ({
      diameter,
      velocity: result.velocity,
      pressureDrop: result.pressureDrop
    })).catch(error => ({
      diameter,
      error: error.message
    }))
  );
  
  const results = await Promise.all(promises);
  
  results.forEach(result => {
    if (result.error) {
      console.log(`${result.diameter.toFixed(3)}          Error: ${result.error}`);
    } else {
      console.log(
        `${result.diameter.toFixed(3)}          ` +
        `${result.velocity.toFixed(3)}          ` +
        `${(result.pressureDrop/1000).toFixed(2)}`
      );
    }
  });
}

async function pumpCurveAnalysis() {
  console.log('\n\nPump Operating Curve Analysis');
  console.log('='.repeat(60));
  
  const operatingPoints = [
    { flow: 0.02, head: 70 },
    { flow: 0.03, head: 65 },
    { flow: 0.04, head: 58 },
    { flow: 0.05, head: 50 },
    { flow: 0.06, head: 40 },
    { flow: 0.07, head: 28 }
  ];
  
  console.log('\nFlow (m³/s)   Head (m)   Power (kW)   Efficiency');
  console.log('-'.repeat(60));
  
  for (const point of operatingPoints) {
    try {
      const result = await ev.pumpPower({
        flowRate: point.flow,
        head: point.head,
        efficiency: 0.8
      });
      
      console.log(
        `${point.flow.toFixed(3)}        ` +
        `${point.head.toFixed(1)}     ` +
        `${(result.shaftPower/1000).toFixed(2)}        ` +
        `80%`
      );
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`${point.flow.toFixed(3)}        ${point.head.toFixed(1)}     Error: ${error.message}`);
    }
  }
}

async function heatExchangerSizing() {
  console.log('\n\nHeat Exchanger Sizing Analysis');
  console.log('='.repeat(60));
  
  const heatDuties = [50000, 75000, 100000, 150000, 200000];  // Watts
  const overallU = 500;  // W/m²·K
  
  console.log('\nHeat Duty (kW)   Required Area (m²)   Effectiveness (%)');
  console.log('-'.repeat(60));
  
  for (const duty of heatDuties) {
    try {
      const result = await ev.heatExchanger({
        heatDuty: duty,
        overallU: overallU,
        tHotIn: 373,
        tHotOut: 323,
        tColdIn: 293,
        tColdOut: 333
      });
      
      console.log(
        `${(duty/1000).toFixed(1)}             ` +
        `${result.area.toFixed(2)}              ` +
        `${(result.effectiveness*100).toFixed(1)}`
      );
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`${(duty/1000).toFixed(1)}             Error: ${error.message}`);
    }
  }
}

// Run all batch examples
async function runAll() {
  try {
    await batchPressureDrop();
    await pumpCurveAnalysis();
    await heatExchangerSizing();
    console.log('\n✓ All batch calculations completed!');
  } catch (error) {
    console.error('\n✗ Batch processing failed:', error.message);
  }
}

runAll();

