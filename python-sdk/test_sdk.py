#!/usr/bin/env python3
"""
Simple test script for EngiVault SDK
"""

import sys
import os

# Add the SDK to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

try:
    from engivault import EngiVault
    
    print("🐍 EngiVault Python SDK Test")
    print("=" * 40)
    
    # Test with your working JWT token
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRjNjlhMi03NmNiLTRhYmEtYjViNi1jNzQ1YTk0YmM3NmQiLCJlbWFpbCI6ImFkbWluQGVuZ2l2YXVsdC5jb20iLCJpYXQiOjE3NTgwNDMxMjUsImV4cCI6MTc1ODY0NzkyNX0.eraKSPQN-YYZ6WUTjhbELVACJuWL_DaovOgVI_H-UTE"
    
    client = EngiVault(jwt_token=jwt_token)
    print("✅ Client created successfully")
    
    # Test pressure drop calculation
    print("\n💧 Testing Pressure Drop Calculation...")
    result = client.hydraulics.pressure_drop(
        flow_rate=0.1,
        pipe_diameter=0.1,
        pipe_length=100,
        fluid_density=1000,
        fluid_viscosity=0.001
    )
    
    print(f"✅ Pressure Drop: {result.pressure_drop:,.2f} Pa")
    print(f"   Reynolds Number: {result.reynolds_number:,.0f}")
    print(f"   Velocity: {result.velocity:.2f} m/s")
    
    # Test pump performance
    print("\n⚙️  Testing Pump Performance Calculation...")
    result = client.pumps.performance(
        flow_rate=0.05,
        head=50,
        efficiency=0.8,
        power=5000
    )
    
    print(f"✅ Hydraulic Power: {result.hydraulic_power:.3f} kW")
    print(f"   Brake Power: {result.brake_power:.3f} kW")
    print(f"   Efficiency: {result.efficiency:.1%}")
    
    print("\n🎉 All tests passed! SDK is working perfectly!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all dependencies are installed")
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
