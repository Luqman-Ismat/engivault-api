#!/usr/bin/env python3
"""
Test EngiVault Fluid Mechanics Module
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from engivault import EngiVault

def main():
    """Test fluid mechanics calculations."""
    
    print("💨 EngiVault Fluid Mechanics Module Test")
    print("=" * 50)
    
    # Test with your working JWT token
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRjNjlhMi03NmNiLTRhYmEtYjViNi1jNzQ1YTk0YmM3NmQiLCJlbWFpbCI6ImFkbWluQGVuZ2l2YXVsdC5jb20iLCJpYXQiOjE3NTgwNDMxMjUsImV4cCI6MTc1ODY0NzkyNX0.eraKSPQN-YYZ6WUTjhbELVACJuWL_DaovOgVI_H-UTE"
    
    client = EngiVault(jwt_token=jwt_token)
    print("✅ Client created successfully")
    
    # Test 1: Open Channel Flow
    print("\n🌊 Testing Open Channel Flow (Manning's Equation)...")
    try:
        result = client.fluid_mechanics.open_channel_flow(
            flow_rate=5.0,          # m³/s
            channel_width=3.0,      # m
            channel_slope=0.001,    # 0.1% slope
            mannings_coeff=0.03,    # Concrete channel
            channel_shape="rectangular"
        )
        
        print(f"✅ Open Channel Analysis:")
        print(f"   Flow Rate: 5.0 m³/s in 3.0 m wide channel")
        print(f"   Normal Depth: {result.normal_depth:.2f} m")
        print(f"   Critical Depth: {result.critical_depth:.2f} m")
        print(f"   Velocity: {result.velocity:.2f} m/s")
        print(f"   Froude Number: {result.froude_number:.2f}")
        print(f"   Flow Regime: {result.flow_regime}")
        print(f"   Hydraulic Radius: {result.hydraulic_radius:.2f} m")
        
    except Exception as e:
        print(f"❌ Open channel test failed: {e}")
    
    # Test 2: Compressible Flow
    print("\n✈️ Testing Compressible Flow (Air at 100 m/s)...")
    try:
        gas_properties = {
            'gamma': 1.4,           # Air
            'gasConstant': 287,     # J/kg·K for air
            'molecularWeight': 28.97 # kg/kmol
        }
        
        result = client.fluid_mechanics.compressible_flow(
            temperature=288,        # 15°C
            pressure=101325,        # 1 atm
            gas_properties=gas_properties,
            velocity=100            # m/s
        )
        
        print(f"✅ Compressible Flow Analysis:")
        print(f"   Velocity: 100 m/s at 15°C, 1 atm")
        print(f"   Mach Number: {result.mach_number:.3f}")
        print(f"   Speed of Sound: {result.speed_of_sound:.1f} m/s")
        print(f"   Flow Regime: {result.flow_regime}")
        print(f"   Stagnation Temperature: {result.stagnation_temperature:.1f} K ({result.stagnation_temperature-273.15:.1f}°C)")
        print(f"   Stagnation Pressure: {result.stagnation_pressure:.0f} Pa ({result.stagnation_pressure/1000:.1f} kPa)")
        print(f"   Density: {result.density:.3f} kg/m³")
        
    except Exception as e:
        print(f"❌ Compressible flow test failed: {e}")
    
    # Test 3: Boundary Layer Analysis
    print("\n🌀 Testing Boundary Layer Analysis (Air over Flat Plate)...")
    try:
        fluid_properties = {
            'density': 1.225,           # kg/m³ (air at 15°C)
            'viscosity': 1.81e-5,       # Pa·s (air)
            'kinematicViscosity': 1.48e-5 # m²/s (air)
        }
        
        result = client.fluid_mechanics.boundary_layer(
            velocity=10,            # m/s
            distance=0.5,           # 0.5 m from leading edge
            fluid_properties=fluid_properties
        )
        
        print(f"✅ Boundary Layer Analysis:")
        print(f"   Air flow at 10 m/s over flat plate")
        print(f"   Distance: 0.5 m from leading edge")
        print(f"   Reynolds Number: {result.reynolds_number:,.0f}")
        print(f"   Flow Regime: {result.flow_regime}")
        print(f"   Boundary Layer Thickness: {result.boundary_layer_thickness*1000:.2f} mm")
        print(f"   Displacement Thickness: {result.displacement_thickness*1000:.2f} mm")
        print(f"   Skin Friction Coefficient: {result.skin_friction_coefficient:.6f}")
        print(f"   Wall Shear Stress: {result.wall_shear_stress:.3f} Pa")
        
    except Exception as e:
        print(f"❌ Boundary layer test failed: {e}")
    
    # Test 4: External Flow (Sphere)
    print("\n⚽ Testing External Flow (Sphere in Air)...")
    try:
        fluid_properties = {
            'density': 1.225,       # kg/m³ (air)
            'viscosity': 1.81e-5    # Pa·s (air)
        }
        
        result = client.fluid_mechanics.external_flow(
            velocity=20,            # m/s
            characteristic_length=0.1, # 0.1 m diameter sphere
            fluid_properties=fluid_properties,
            geometry="sphere"
        )
        
        print(f"✅ External Flow Analysis:")
        print(f"   0.1 m diameter sphere in 20 m/s air flow")
        print(f"   Reynolds Number: {result.reynolds_number:,.0f}")
        print(f"   Drag Coefficient: {result.drag_coefficient:.3f}")
        print(f"   Drag Force: {result.drag_force:.2f} N")
        print(f"   Pressure Coefficient: {result.pressure_coefficient:.3f}")
        
    except Exception as e:
        print(f"❌ External flow test failed: {e}")
    
    # Test 5: Normal Shock Wave
    print("\n💥 Testing Normal Shock Wave (Supersonic Flow)...")
    try:
        result = client.fluid_mechanics.normal_shock(
            mach_number_1=2.0,      # Supersonic upstream
            gamma=1.4               # Air
        )
        
        print(f"✅ Normal Shock Analysis:")
        print(f"   Upstream Mach Number: 2.0")
        print(f"   Downstream Mach Number: {result['machNumber2']:.3f}")
        print(f"   Pressure Ratio (p₂/p₁): {result['pressureRatio']:.2f}")
        print(f"   Density Ratio (ρ₂/ρ₁): {result['densityRatio']:.2f}")
        print(f"   Temperature Ratio (T₂/T₁): {result['temperatureRatio']:.2f}")
        print(f"   Stagnation Pressure Ratio: {result['stagnationPressureRatio']:.3f}")
        
    except Exception as e:
        print(f"❌ Normal shock test failed: {e}")
    
    # Test 6: Choked Flow
    print("\n🚀 Testing Choked Flow (Critical Conditions)...")
    try:
        result = client.fluid_mechanics.choked_flow(
            stagnation_temperature=300, # K (27°C)
            stagnation_pressure=200000, # Pa (2 bar)
            gamma=1.4,
            gas_constant=287
        )
        
        print(f"✅ Choked Flow Analysis:")
        print(f"   Stagnation Conditions: 27°C, 2 bar")
        print(f"   Critical Temperature: {result['criticalTemperature']:.1f} K ({result['criticalTemperature']-273.15:.1f}°C)")
        print(f"   Critical Pressure: {result['criticalPressure']:.0f} Pa ({result['criticalPressure']/1000:.1f} kPa)")
        print(f"   Critical Velocity: {result['criticalVelocity']:.1f} m/s")
        print(f"   Critical Density: {result['criticalDensity']:.3f} kg/m³")
        print(f"   Mass Flow Rate: {result['massFlowRate']:.2f} kg/s·m²")
        
    except Exception as e:
        print(f"❌ Choked flow test failed: {e}")
    
    print("\n🎉 Fluid Mechanics Module testing completed!")
    print("📚 Advanced fluid mechanics calculations are now available in EngiVault!")
    print("\n🌊 Applications covered:")
    print("   • Open channel flow (rivers, canals, drainage)")
    print("   • Compressible flow (gas pipelines, nozzles, diffusers)")
    print("   • Boundary layers (drag analysis, heat transfer)")
    print("   • External flow (spheres, cylinders, airfoils)")
    print("   • Shock waves (supersonic flow, gas dynamics)")
    print("   • Choked flow (critical flow, nozzle design)")

if __name__ == "__main__":
    main()
