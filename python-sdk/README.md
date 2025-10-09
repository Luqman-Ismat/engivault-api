# EngiVault Python SDK

[![PyPI version](https://badge.fury.io/py/engivault.svg)](https://badge.fury.io/py/engivault)
[![Python Support](https://img.shields.io/pypi/pyversions/engivault.svg)](https://pypi.org/project/engivault/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple, powerful Python SDK for the [EngiVault Engineering Calculations API](https://engivault-api-production.up.railway.app).

## 🚀 Quick Start

### Installation

```bash
pip install engivault
```

### Simplified API (New! ⭐)

The easiest way to use EngiVault - just 3 lines:

```python
import engivault as ev

ev.init('your-api-key')  # Initialize once

# Call functions directly - no client needed!
result = ev.pressure_drop(
    flow_rate=0.01,
    pipe_diameter=0.1,
    pipe_length=100,
    fluid_density=1000,
    fluid_viscosity=0.001
)

print(f"Pressure drop: {result['pressure_drop']:,.2f} Pa")
```

More examples:
```python
# Pump power - simple!
pump_result = ev.pump_power(flow_rate=0.05, head=50, efficiency=0.8)
print(f"Power: {pump_result['shaft_power']/1000:.2f} kW")

# Heat transfer LMTD
lmtd_result = ev.lmtd(t_hot_in=373, t_hot_out=323, t_cold_in=293, t_cold_out=333)
print(f"LMTD: {lmtd_result['lmtd']:.2f} K")

# Open channel flow
channel = ev.open_channel_flow(flow_rate=10, channel_width=5, channel_slope=0.001, mannings_coeff=0.03)
print(f"Normal depth: {channel['normal_depth']:.3f} m")
```

### Traditional API (Still Supported)

For more control, use the traditional client-based API:

```python
import engivault

# Create client with your API key
client = engivault.EngiVault("your-api-key")

# Calculate pressure drop
result = client.hydraulics.pressure_drop(
    flow_rate=0.1,           # m³/s
    pipe_diameter=0.1,       # meters
    pipe_length=100,         # meters
    fluid_density=1000,      # kg/m³
    fluid_viscosity=0.001,   # Pa·s
)

print(f"Pressure drop: {result.pressure_drop:,.2f} Pa")
print(f"Reynolds number: {result.reynolds_number:,.0f}")
```

## 📚 Features

- **🔧 Hydraulic Calculations**: Pressure drop, flow rate analysis
- **⚙️ Pump Analysis**: Performance calculations, NPSH analysis
- **📊 Analytics**: Usage statistics and monitoring
- **🛡️ Type Safety**: Full Pydantic validation and type hints
- **🚀 Simple API**: Clean, intuitive interface
- **⚡ Fast**: Optimized for performance
- **🔒 Secure**: Built-in authentication and error handling

## 🧮 Available Calculations

### Hydraulics

#### Pressure Drop Calculation
Calculate pressure drop using the Darcy-Weisbach equation:

```python
result = client.hydraulics.pressure_drop(
    flow_rate=0.1,           # Flow rate (m³/s)
    pipe_diameter=0.1,       # Pipe diameter (m)
    pipe_length=100,         # Pipe length (m)
    fluid_density=1000,      # Fluid density (kg/m³)
    fluid_viscosity=0.001,   # Fluid viscosity (Pa·s)
    pipe_roughness=0.00015,  # Pipe roughness (m) - optional
)

# Results
print(f"Pressure drop: {result.pressure_drop} Pa")
print(f"Reynolds number: {result.reynolds_number}")
print(f"Friction factor: {result.friction_factor}")
print(f"Velocity: {result.velocity} m/s")
```

#### Flow Rate Calculation
Calculate flow rate from pressure drop:

```python
result = client.hydraulics.flow_rate(
    pressure_drop=10000,     # Pressure drop (Pa)
    pipe_diameter=0.1,       # Pipe diameter (m)
    pipe_length=100,         # Pipe length (m)
    fluid_density=1000,      # Fluid density (kg/m³)
    fluid_viscosity=0.001,   # Fluid viscosity (Pa·s)
)

print(f"Flow rate: {result.flow_rate} m³/s")
print(f"Velocity: {result.velocity} m/s")
```

### Pumps

#### Pump Performance Analysis
Calculate pump performance parameters:

```python
result = client.pumps.performance(
    flow_rate=0.05,    # Flow rate (m³/s)
    head=50,           # Pump head (m)
    efficiency=0.8,    # Efficiency (0-1)
    power=5000,        # Power (W)
)

print(f"Hydraulic power: {result.hydraulic_power} kW")
print(f"Brake power: {result.brake_power} kW")
print(f"Specific speed: {result.specific_speed}")
```

#### NPSH Analysis
Calculate Net Positive Suction Head:

```python
result = client.pumps.npsh(
    suction_pressure=101325,  # Suction pressure (Pa)
    vapor_pressure=2337,      # Vapor pressure (Pa)
    fluid_density=1000,       # Fluid density (kg/m³)
    suction_velocity=2.0,     # Suction velocity (m/s)
    suction_losses=1.5,       # Suction losses (m)
)

print(f"NPSH available: {result.npsh_available} m")
print(f"NPSH required: {result.npsh_required} m")
print(f"Cavitation risk: {result.is_cavitation_risk}")
```

## 📊 Analytics

### Usage Statistics
Track your API usage:

```python
# Get usage stats for last 30 days (default)
stats = client.analytics.usage_stats()

# Get stats for specific period
stats = client.analytics.usage_stats(days=7)

print(f"Total requests: {stats.total_requests}")
print(f"Requests today: {stats.requests_today}")
print(f"Average response time: {stats.average_response_time} ms")
```

### Subscription Limits
Check your subscription limits:

```python
limits = client.analytics.subscription_limits()

print(f"Subscription tier: {limits['subscriptionTier']}")
print(f"Monthly limit: {limits['requestsPerMonth']}")
print(f"Remaining this month: {limits['remainingRequestsThisMonth']}")
```

## 🔑 Authentication

### Using JWT Token (Temporary)
```python
client = engivault.EngiVault(jwt_token="your-jwt-token")
```

### Using API Key (Recommended)
```python
client = engivault.EngiVault(api_key="your-api-key")
```

### Environment Variable
```bash
export ENGIVAULT_API_KEY="your-api-key"
```

```python
import os
client = engivault.EngiVault(os.getenv("ENGIVAULT_API_KEY"))
```

## 🛠️ Advanced Usage

### Error Handling
```python
from engivault.exceptions import (
    AuthenticationError,
    RateLimitError,
    ValidationError,
    APIError
)

try:
    result = client.hydraulics.pressure_drop(...)
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded")
except ValidationError as e:
    print(f"Invalid input: {e}")
except APIError as e:
    print(f"API error: {e}")
```

### Custom Configuration
```python
client = engivault.EngiVault(
    api_key="your-key",
    base_url="https://your-custom-domain.com",  # Custom API URL
    timeout=60,  # Custom timeout
)
```

## 📖 Examples

### Real-World Pipe Sizing
```python
import engivault

client = engivault.EngiVault("your-api-key")

# Design parameters
required_flow = 0.05  # m³/s
max_pressure_drop = 50000  # Pa
pipe_length = 200  # m
fluid_density = 1000  # kg/m³ (water)
fluid_viscosity = 0.001  # Pa·s

# Test different pipe diameters
diameters = [0.08, 0.1, 0.12, 0.15]  # meters

print("Pipe Diameter | Pressure Drop | Velocity | Reynolds")
print("-" * 50)

for diameter in diameters:
    result = client.hydraulics.pressure_drop(
        flow_rate=required_flow,
        pipe_diameter=diameter,
        pipe_length=pipe_length,
        fluid_density=fluid_density,
        fluid_viscosity=fluid_viscosity,
    )
    
    print(f"{diameter:11.2f} m | {result.pressure_drop:11,.0f} Pa | {result.velocity:6.2f} m/s | {result.reynolds_number:8,.0f}")
    
    if result.pressure_drop <= max_pressure_drop:
        print(f"✅ Diameter {diameter} m meets pressure drop requirement")
        break
```

### Pump Selection Analysis
```python
# Analyze multiple pump options
pumps = [
    {"name": "Pump A", "flow": 0.04, "head": 45, "efficiency": 0.75, "power": 4500},
    {"name": "Pump B", "flow": 0.05, "head": 50, "efficiency": 0.80, "power": 5000},
    {"name": "Pump C", "flow": 0.06, "head": 55, "efficiency": 0.78, "power": 5500},
]

print("Pump Comparison Analysis")
print("-" * 40)

for pump in pumps:
    result = client.pumps.performance(**{k: v for k, v in pump.items() if k != "name"})
    
    print(f"\n{pump['name']}:")
    print(f"  Hydraulic Power: {result.hydraulic_power:.3f} kW")
    print(f"  Brake Power: {result.brake_power:.3f} kW")
    print(f"  Specific Speed: {result.specific_speed:.6f}")
    print(f"  Efficiency: {result.efficiency:.1%}")
```

## 🔧 Development

### Install for Development
```bash
git clone https://github.com/Luqman-Ismat/engivault-python-sdk
cd engivault-python-sdk
pip install -e .[dev]
```

### Run Tests
```bash
pytest tests/ -v --cov=engivault
```

### Code Formatting
```bash
black engivault/ tests/
isort engivault/ tests/
flake8 engivault/ tests/
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- **Documentation**: [API Docs](https://engivault-api-production.up.railway.app/documentation)
- **Issues**: [GitHub Issues](https://github.com/Luqman-Ismat/engivault-python-sdk/issues)
- **Email**: support@engivault.com

---

**🎉 Start calculating with EngiVault today!**
