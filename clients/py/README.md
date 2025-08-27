# EngiVault Python SDK

A Python client library for the EngiVault API.

## Installation

```bash
pip install -e .
```

## Usage

```python
from engivault_py_sdk import EngiVaultClient

# Create client
client = EngiVaultClient(base_url="http://localhost:3000")

# Calculate pressure drop
result = client.calculate_pressure_drop({
    "Q": 0.1,
    "L": 100,
    "D": 0.1,
    "roughness": 0.000045,
    "fluid": "water"
})

print(result)
```

## Available Methods

- `calculate_pressure_drop()` - Calculate pressure drop
- `calculate_minor_losses()` - Calculate minor losses
- `size_pipe()` - Size pipe for target velocity or pressure drop
- `calculate_npsh()` - Calculate NPSH
- `check_bep()` - Check Best Efficiency Point
- `calculate_valve_flow()` - Calculate valve flow
- `solve_network()` - Solve network using Hardy Cross method
- `calculate_transients()` - Calculate transients
- `calculate_gas_flow()` - Calculate gas flow
- `calculate_fanno_line()` - Calculate Fanno line
- `calculate_rayleigh_line()` - Calculate Rayleigh line
- `calculate_viscosity_adjusted_drop()` - Calculate viscosity adjusted pressure drop
- `calculate_hx_pressure_drop()` - Calculate heat exchanger pressure drop
- `calculate_slurry_flow()` - Calculate slurry flow
- `calculate_fill_drain_time()` - Calculate fill/drain time
- `fit_pump_curve()` - Fit pump curve
- `convert_units()` - Convert units
- `get_health()` - Get health status
