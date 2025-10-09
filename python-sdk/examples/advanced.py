#!/usr/bin/env python3
"""
EngiVault Python SDK - Advanced Usage

This example demonstrates all features including:
- Both simple and traditional API
- Error handling
- Batch processing
- Configuration options
"""

import engivault as ev
from engivault import EngiVaultError, RateLimitError
import os

# Method 1: Simple API with global client
print("=" * 60)
print("Method 1: Simple API (Recommended for scripts)")
print("=" * 60)

# Initialize global client
ev.init(
    api_key=os.getenv('ENGIVAULT_API_KEY', 'your-api-key-here'),
    timeout=30,  # seconds
    retries=3
)

try:
    # Direct function calls
    result = ev.pressure_drop(
        flow_rate=0.01,
        pipe_diameter=0.1,
        pipe_length=100,
        fluid_density=1000,
        fluid_viscosity=0.001
    )
    print(f"✓ Pressure drop: {result['pressure_drop']:.2f} Pa")
    
except EngiVaultError as e:
    print(f"✗ Error: {e.message} (Status: {e.status_code})")

# Method 2: Traditional API with client instance
print("\n" + "=" * 60)
print("Method 2: Traditional API (Better for classes/apps)")
print("=" * 60)

# Create client instance
client = ev.EngiVault(
    api_key=os.getenv('ENGIVAULT_API_KEY'),
    base_url='https://engivault-api.railway.app'
)

try:
    # Use client methods
    result = client.hydraulics.pressure_drop(
        flow_rate=0.01,
        pipe_diameter=0.1,
        pipe_length=100,
        fluid_density=1000,
        fluid_viscosity=0.001
    )
    print(f"✓ Pressure drop: {result.pressure_drop:.2f} Pa")
    print(f"✓ Velocity: {result.velocity:.3f} m/s")
    print(f"✓ Reynolds: {result.reynolds_number:.0f}")
    
except RateLimitError as e:
    print(f"✗ Rate limit exceeded: {e.message}")
    
except EngiVaultError as e:
    print(f"✗ API Error: {e.message}")

# Batch processing example
print("\n" + "=" * 60)
print("Batch Processing Example")
print("=" * 60)

pipe_diameters = [0.05, 0.08, 0.1, 0.15, 0.2]  # meters
flow_rate = 0.01  # m³/s

print(f"\nPressure drop for {flow_rate} m³/s flow in various pipe sizes:")
print(f"{'Diameter (m)':<15} {'Velocity (m/s)':<15} {'ΔP (kPa)':<15}")
print("-" * 45)

for diameter in pipe_diameters:
    try:
        result = ev.pressure_drop(
            flow_rate=flow_rate,
            pipe_diameter=diameter,
            pipe_length=100,
            fluid_density=1000,
            fluid_viscosity=0.001
        )
        print(f"{diameter:<15.3f} {result['velocity']:<15.3f} {result['pressure_drop']/1000:<15.2f}")
    except Exception as e:
        print(f"{diameter:<15.3f} {'Error':<15} {str(e):<15}")

# Heat transfer calculations
print("\n" + "=" * 60)
print("Heat Transfer Example")
print("=" * 60)

try:
    # Calculate LMTD
    lmtd_result = ev.lmtd(
        t_hot_in=373,      # K (100°C)
        t_hot_out=323,     # K (50°C)
        t_cold_in=293,     # K (20°C)
        t_cold_out=333,    # K (60°C)
        flow_arrangement='counterflow'
    )
    print(f"✓ LMTD: {lmtd_result['lmtd']:.2f} K")
    print(f"✓ ΔT1: {lmtd_result['delta_t1']:.2f} K")
    print(f"✓ ΔT2: {lmtd_result['delta_t2']:.2f} K")
    
    # Calculate heat exchanger area
    hx_result = ev.heat_exchanger(
        heat_duty=100000,       # W (100 kW)
        overall_u=500,          # W/m²·K
        t_hot_in=373,
        t_hot_out=323,
        t_cold_in=293,
        t_cold_out=333
    )
    print(f"\n✓ Required area: {hx_result['area']:.2f} m²")
    print(f"✓ Effectiveness: {hx_result['effectiveness']*100:.1f}%")
    print(f"✓ NTU: {hx_result['ntu']:.2f}")
    
except EngiVaultError as e:
    print(f"✗ Calculation failed: {e.message}")

# Pump analysis
print("\n" + "=" * 60)
print("Pump Analysis Example")
print("=" * 60)

try:
    # Pump power for different operating points
    operating_points = [
        (0.03, 60),  # Low flow, high head
        (0.05, 50),  # Design point
        (0.07, 35),  # High flow, low head
    ]
    
    print(f"{'Flow (m³/s)':<15} {'Head (m)':<15} {'Power (kW)':<15}")
    print("-" * 45)
    
    for flow, head in operating_points:
        result = ev.pump_power(
            flow_rate=flow,
            head=head,
            efficiency=0.8
        )
        print(f"{flow:<15.3f} {head:<15.1f} {result['shaft_power']/1000:<15.2f}")

except EngiVaultError as e:
    print(f"✗ Pump calculation failed: {e.message}")

print("\n" + "=" * 60)
print("Examples Complete!")
print("=" * 60)

