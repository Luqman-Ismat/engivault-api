import { EngiVaultClient } from './index';

async function main() {
  // Create client instance
  const client = new EngiVaultClient({
    BASE: 'http://localhost:3000',
  });

  try {
    // Example 1: Calculate pressure drop
    console.log('🔧 Calculating pressure drop...');
    const pressureDropResult = await client.hydraulics.calculatePressureDrop({
      Q: 0.1,
      L: 100,
      D: 0.1,
      roughness: 0.000045,
      fluid: 'water',
      units: 'SI'
    });
    console.log('Pressure drop result:', pressureDropResult);

    // Example 2: Fit pump curve
    console.log('\n📈 Fitting pump curve...');
    const curveFitResult = await client.curves.fitPumpCurve({
      points: [
        { q: 10, h: 94.5 },
        { q: 20, h: 88 },
        { q: 30, h: 80.5 },
        { q: 40, h: 72 },
        { q: 50, h: 62.5 }
      ],
      model: 'quadratic'
    });
    console.log('Curve fit result:', curveFitResult);

    // Example 3: Size pipe for target velocity
    console.log('\n📏 Sizing pipe for target velocity...');
    const pipeSizingResult = await client.hydraulics.sizePipeForTarget({
      Q: 0.1,
      target: 'velocity',
      value: 2.0,
      L: 100,
      roughness: 0.000045,
      fluid: 'water',
      units: 'SI'
    });
    console.log('Pipe sizing result:', pipeSizingResult);

    // Example 4: Calculate NPSH
    console.log('\n💧 Calculating NPSH...');
    const npshResult = await client.pumps.calculateNpsh({
      P_atm: 101325,
      P_vapor: 2337,
      h_suction: 2,
      h_friction: 0.5,
      V_suction: 1.5,
      g: 9.81
    });
    console.log('NPSH result:', npshResult);

    // Example 5: Convert units
    console.log('\n🔄 Converting units...');
    const unitConversionResult = await client.utilities.convertUnits({
      value: 100,
      from_unit: 'L/min',
      to_unit: 'm³/s',
      quantity: 'flow_rate'
    });
    console.log('Unit conversion result:', unitConversionResult);

    // Example 6: Check health
    console.log('\n🏥 Checking health...');
    const healthResult = await client.health.getHealth();
    console.log('Health check result:', healthResult);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run examples
main().catch(console.error);
