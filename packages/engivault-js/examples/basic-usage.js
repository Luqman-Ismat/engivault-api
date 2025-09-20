const { EngiVault } = require('engivault');

// Initialize the client
const client = new EngiVault({
  apiKey: 'your-api-key-here', // or set ENGIVAULT_API_KEY environment variable
  baseURL: 'https://engivault-api.railway.app' // optional, defaults to production
});

async function basicExample() {
  try {
    // Health check
    console.log('Checking API health...');
    const health = await client.health();
    console.log('API Status:', health.status);

    // Fluid mechanics calculation
    console.log('\n--- Fluid Mechanics Example ---');
    const openChannelResult = await client.fluidMechanics.openChannelFlow({
      flowRate: 10.0,           // m³/s
      channelWidth: 5.0,        // m
      channelSlope: 0.001,      // dimensionless
      manningSCoeff: 0.03,      // Manning's n
      channelShape: 'rectangular'
    });
    
    console.log('Open Channel Flow Results:');
    console.log(`Normal Depth: ${openChannelResult.normalDepth.toFixed(3)} m`);
    console.log(`Velocity: ${openChannelResult.velocity.toFixed(3)} m/s`);
    console.log(`Froude Number: ${openChannelResult.froudeNumber.toFixed(3)}`);
    console.log(`Flow Regime: ${openChannelResult.flowRegime}`);

    // Heat transfer calculation
    console.log('\n--- Heat Transfer Example ---');
    const lmtdResult = await client.heatTransfer.lmtd({
      tHotIn: 373,      // K (100°C)
      tHotOut: 323,     // K (50°C)
      tColdIn: 293,     // K (20°C)
      tColdOut: 333,    // K (60°C)
      flowArrangement: 'counterflow'
    });
    
    console.log('LMTD Calculation Results:');
    console.log(`LMTD: ${lmtdResult.lmtd.toFixed(2)} K`);

    // Heat exchanger area calculation
    const heatExchangerResult = await client.heatTransfer.heatExchangerArea({
      heatDuty: 100000,         // W (100 kW)
      overallU: 500,            // W/m²·K
      tHotIn: 373,              // K
      tHotOut: 323,             // K
      tColdIn: 293,             // K
      tColdOut: 333,            // K
      flowArrangement: 'counterflow'
    });

    console.log('\nHeat Exchanger Results:');
    console.log(`Required Area: ${heatExchangerResult.area.toFixed(2)} m²`);
    console.log(`Effectiveness: ${(heatExchangerResult.effectiveness * 100).toFixed(1)}%`);
    console.log(`NTU: ${heatExchangerResult.ntu.toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
      console.error('Error Code:', error.code);
    }
  }
}

// Run the example
basicExample();
