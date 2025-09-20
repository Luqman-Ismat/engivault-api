import { EngiVault, FluidMechanics, HeatTransfer, EngiVaultError } from 'engivault';

// TypeScript example with full type safety
const client = new EngiVault({
  apiKey: process.env.ENGIVAULT_API_KEY,
  timeout: 10000,
  retries: 3
});

async function typescriptExample(): Promise<void> {
  try {
    // Using the unified client
    console.log('=== Unified Client Example ===');
    
    const compressibleFlowResult = await client.fluidMechanics.compressibleFlow({
      machNumber: 2.0,
      temperature: 288,  // K
      pressure: 101325,  // Pa
      gasProperties: {
        gamma: 1.4,
        gasConstant: 287,    // J/kg·K
        molecularWeight: 28.97 // kg/kmol
      },
      flowType: 'isentropic'
    });

    console.log('Compressible Flow Results:');
    console.log(`Velocity: ${compressibleFlowResult.velocity.toFixed(1)} m/s`);
    console.log(`Stagnation Temperature: ${compressibleFlowResult.stagnationTemperature.toFixed(1)} K`);
    console.log(`Flow Regime: ${compressibleFlowResult.flowRegime}`);

    // Using specialized modules
    console.log('\n=== Specialized Module Example ===');
    
    const heatTransfer = new HeatTransfer({
      apiKey: process.env.ENGIVAULT_API_KEY
    });

    const finResult = await heatTransfer.finAnalysis({
      finLength: 0.05,              // m
      finThickness: 0.002,          // m
      finWidth: 0.1,                // m
      thermalConductivity: 200,     // W/m·K (aluminum)
      heatTransferCoefficient: 25,  // W/m²·K
      baseTemperature: 373,         // K (100°C)
      ambientTemperature: 293       // K (20°C)
    });

    console.log('Fin Analysis Results:');
    console.log(`Fin Efficiency: ${(finResult.finEfficiency * 100).toFixed(1)}%`);
    console.log(`Fin Effectiveness: ${finResult.finEffectiveness.toFixed(2)}`);
    console.log(`Heat Transfer Rate: ${finResult.heatTransferRate.toFixed(1)} W`);

    // Tree-shakeable imports example
    console.log('\n=== Tree-Shakeable Import Example ===');
    
    const fluidMechanics = new FluidMechanics({
      apiKey: process.env.ENGIVAULT_API_KEY
    });

    const boundaryLayerResult = await fluidMechanics.boundaryLayer({
      velocity: 10,     // m/s
      distance: 0.5,    // m
      fluidProperties: {
        density: 1.225,           // kg/m³ (air at STP)
        viscosity: 1.81e-5,       // Pa·s
        kinematicViscosity: 1.48e-5 // m²/s
      },
      surfaceRoughness: 1e-6,     // m
      plateLength: 1.0            // m
    });

    console.log('Boundary Layer Results:');
    console.log(`Reynolds Number: ${boundaryLayerResult.reynoldsNumber.toFixed(0)}`);
    console.log(`Boundary Layer Thickness: ${(boundaryLayerResult.boundaryLayerThickness * 1000).toFixed(2)} mm`);
    console.log(`Flow Regime: ${boundaryLayerResult.flowRegime}`);

  } catch (error) {
    if (error instanceof EngiVaultError) {
      console.error(`EngiVault Error [${error.code}]:`, error.message);
      console.error(`Status Code: ${error.statusCode}`);
    } else {
      console.error('Unexpected Error:', error);
    }
  }
}

// Configuration example
async function configurationExample(): Promise<void> {
  console.log('\n=== Configuration Example ===');
  
  const client = new EngiVault();
  
  // Check current configuration
  const config = client.getConfig();
  console.log('Current Config:', config);
  
  // Set API key dynamically
  client.setApiKey('new-api-key');
  console.log('API Key Set:', client.getConfig().hasApiKey);
  
  // Clear API key
  client.clearApiKey();
  console.log('API Key Cleared:', client.getConfig().hasApiKey);
}

// Run examples
async function runExamples(): Promise<void> {
  await typescriptExample();
  await configurationExample();
}

runExamples().catch(console.error);
