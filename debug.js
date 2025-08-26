const { convert } = require('./dist/utils/units.js');

// Test the conversion that's failing
try {
  const result = convert(0.000045, 'm', 'm');
  console.log('Conversion successful:', result);
} catch (error) {
  console.log('Conversion failed:', error.message);
}

// Test with undefined unit
try {
  const result = convert(0.000045, undefined, 'm');
  console.log('Conversion with undefined unit:', result);
} catch (error) {
  console.log('Conversion with undefined unit failed:', error.message);
}
