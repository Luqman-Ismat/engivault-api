#!/usr/bin/env python3
"""
EngiVault Python SDK - Quick Start

This example shows the simplest way to use EngiVault.
Just 5 lines to get started!
"""

import engivault as ev

# 1. Initialize (reads API key from ENGIVAULT_API_KEY env var, or pass it directly)
ev.init('your-api-key-here')  # or ev.init() to use environment variable

# 2. Call any function directly
result = ev.pressure_drop(
    flow_rate=0.01,        # m³/s
    pipe_diameter=0.1,     # m
    pipe_length=100,       # m
    fluid_density=1000,    # kg/m³ (water)
    fluid_viscosity=0.001  # Pa·s (water at 20°C)
)

# 3. Use the results
print(f"Pressure drop: {result['pressure_drop']:.2f} Pa")
print(f"Velocity: {result['velocity']:.2f} m/s")
print(f"Reynolds number: {result['reynolds_number']:.0f}")

# That's it! Just 3 simple steps.

# More examples:

# Pump power
pump_result = ev.pump_power(
    flow_rate=0.05,     # m³/s
    head=50,            # m
    efficiency=0.8      # 80%
)
print(f"\nPump shaft power: {pump_result['shaft_power']/1000:.2f} kW")

# Heat exchanger LMTD
lmtd_result = ev.lmtd(
    t_hot_in=373,       # K (100°C)
    t_hot_out=323,      # K (50°C)
    t_cold_in=293,      # K (20°C)
    t_cold_out=333      # K (60°C)
)
print(f"\nLMTD: {lmtd_result['lmtd']:.2f} K")

# Open channel flow
channel_result = ev.open_channel_flow(
    flow_rate=10.0,        # m³/s
    channel_width=5.0,     # m
    channel_slope=0.001,   # dimensionless
    mannings_coeff=0.03    # Manning's n
)
print(f"\nNormal depth: {channel_result['normal_depth']:.3f} m")
print(f"Flow regime: {channel_result['flow_regime']}")

