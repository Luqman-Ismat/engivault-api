"""
EngiVault Python SDK - Advanced Usage Examples

This example demonstrates advanced usage patterns including
pipe sizing, pump selection, and system analysis.
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from engivault import EngiVault

# Your JWT token (replace with API key in production)
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRjNjlhMi03NmNiLTRhYmEtYjViNi1jNzQ1YTk0YmM3NmQiLCJlbWFpbCI6ImFkbWluQGVuZ2l2YXVsdC5jb20iLCJpYXQiOjE3NTgwNDMxMjUsImV4cCI6MTc1ODY0NzkyNX0.eraKSPQN-YYZ6WUTjhbELVACJuWL_DaovOgVI_H-UTE"


def pipe_sizing_analysis():
    """Demonstrate pipe sizing for a given flow rate and pressure drop limit."""
    print("🔧 Pipe Sizing Analysis")
    print("=" * 40)
    
    client = EngiVault(jwt_token=JWT_TOKEN)
    
    # Design parameters
    required_flow = 0.08  # m³/s
    max_pressure_drop = 50000  # Pa (50 kPa)
    pipe_length = 150  # meters
    fluid_density = 1000  # kg/m³ (water)
    fluid_viscosity = 0.001  # Pa·s (water at 20°C)
    
    # Test different pipe diameters
    diameters = [0.08, 0.10, 0.12, 0.15, 0.20]  # meters
    
    print(f"Required flow rate: {required_flow} m³/s")
    print(f"Maximum pressure drop: {max_pressure_drop:,} Pa")
    print(f"Pipe length: {pipe_length} m")
    print(f"Fluid: Water (ρ={fluid_density} kg/m³, μ={fluid_viscosity} Pa·s)")
    print()
    
    print("Diameter | Pressure Drop |  Velocity  | Reynolds  | Status")
    print("-" * 60)
    
    optimal_diameter = None
    
    for diameter in diameters:
        try:
            result = client.hydraulics.pressure_drop(
                flow_rate=required_flow,
                pipe_diameter=diameter,
                pipe_length=pipe_length,
                fluid_density=fluid_density,
                fluid_viscosity=fluid_viscosity,
            )
            
            status = "✅ OK" if result.pressure_drop <= max_pressure_drop else "❌ High ΔP"
            
            print(f"{diameter:6.2f} m | {result.pressure_drop:11,.0f} Pa | {result.velocity:8.2f} m/s | {result.reynolds_number:7,.0f} | {status}")
            
            if result.pressure_drop <= max_pressure_drop and optimal_diameter is None:
                optimal_diameter = diameter
                
        except Exception as e:
            print(f"{diameter:6.2f} m | Error: {e}")
    
    print()
    if optimal_diameter:
        print(f"🎯 Recommended diameter: {optimal_diameter} m")
    else:
        print("⚠️  No diameter meets the pressure drop requirement")


def pump_comparison():
    """Compare multiple pump options for a given application."""
    print("\n⚙️  Pump Comparison Analysis")
    print("=" * 45)
    
    client = EngiVault(jwt_token=JWT_TOKEN)
    
    # Pump options to compare
    pumps = [
        {"name": "Pump A", "flow_rate": 0.04, "head": 45, "efficiency": 0.75, "power": 4500},
        {"name": "Pump B", "flow_rate": 0.05, "head": 50, "efficiency": 0.80, "power": 5000},
        {"name": "Pump C", "flow_rate": 0.06, "head": 55, "efficiency": 0.78, "power": 5500},
        {"name": "Pump D", "flow_rate": 0.055, "head": 52, "efficiency": 0.82, "power": 5200},
    ]
    
    print("Pump   | Hydraulic | Brake    | Specific | Efficiency")
    print("       | Power     | Power    | Speed    |           ")
    print("-" * 50)
    
    best_pump = None
    best_efficiency = 0
    
    for pump in pumps:
        try:
            result = client.pumps.performance(
                flow_rate=pump["flow_rate"],
                head=pump["head"],
                efficiency=pump["efficiency"],
                power=pump["power"],
            )
            
            print(f"{pump['name']:6} | {result.hydraulic_power:7.3f} kW | {result.brake_power:6.3f} kW | {result.specific_speed:6.4f} | {result.efficiency:7.1%}")
            
            if result.efficiency > best_efficiency:
                best_efficiency = result.efficiency
                best_pump = pump["name"]
                
        except Exception as e:
            print(f"{pump['name']:6} | Error: {e}")
    
    print()
    if best_pump:
        print(f"🏆 Most efficient pump: {best_pump} ({best_efficiency:.1%})")


def npsh_safety_check():
    """Demonstrate NPSH safety analysis for cavitation prevention."""
    print("\n🌊 NPSH Safety Analysis")
    print("=" * 35)
    
    client = EngiVault(jwt_token=JWT_TOKEN)
    
    # System conditions
    scenarios = [
        {"name": "Normal Operation", "suction_pressure": 101325, "vapor_pressure": 2337, "velocity": 2.0, "losses": 1.5},
        {"name": "High Temperature", "suction_pressure": 101325, "vapor_pressure": 7380, "velocity": 2.0, "losses": 1.5},
        {"name": "High Velocity", "suction_pressure": 101325, "vapor_pressure": 2337, "velocity": 4.0, "losses": 2.5},
        {"name": "Poor Suction", "suction_pressure": 95000, "vapor_pressure": 2337, "velocity": 2.5, "losses": 3.0},
    ]
    
    fluid_density = 1000  # kg/m³ (water)
    
    print("Scenario        | NPSH Avail | NPSH Req | Margin | Risk")
    print("-" * 55)
    
    for scenario in scenarios:
        try:
            result = client.pumps.npsh(
                suction_pressure=scenario["suction_pressure"],
                vapor_pressure=scenario["vapor_pressure"],
                fluid_density=fluid_density,
                suction_velocity=scenario["velocity"],
                suction_losses=scenario["losses"],
            )
            
            risk_icon = "⚠️ " if result.is_cavitation_risk else "✅"
            
            print(f"{scenario['name']:14} | {result.npsh_available:8.2f} m | {result.npsh_required:6.2f} m | {result.margin:4.2f} m | {risk_icon}")
            
        except Exception as e:
            print(f"{scenario['name']:14} | Error: {e}")


def system_analysis():
    """Complete system analysis combining multiple calculations."""
    print("\n🔬 Complete System Analysis")
    print("=" * 40)
    
    client = EngiVault(jwt_token=JWT_TOKEN)
    
    # System parameters
    flow_rate = 0.06  # m³/s
    pipe_diameter = 0.12  # m
    pipe_length = 200  # m
    fluid_density = 1000  # kg/m³
    fluid_viscosity = 0.001  # Pa·s
    
    print(f"System: {flow_rate} m³/s through {pipe_diameter} m × {pipe_length} m pipe")
    print()
    
    try:
        # 1. Calculate system pressure drop
        pressure_result = client.hydraulics.pressure_drop(
            flow_rate=flow_rate,
            pipe_diameter=pipe_diameter,
            pipe_length=pipe_length,
            fluid_density=fluid_density,
            fluid_viscosity=fluid_viscosity,
        )
        
        print(f"💧 Hydraulic Analysis:")
        print(f"   Pressure Drop: {pressure_result.pressure_drop:,.0f} Pa ({pressure_result.pressure_drop/1000:.1f} kPa)")
        print(f"   Velocity: {pressure_result.velocity:.2f} m/s")
        print(f"   Reynolds Number: {pressure_result.reynolds_number:,.0f}")
        print(f"   Flow Regime: {'Turbulent' if pressure_result.reynolds_number > 4000 else 'Transitional' if pressure_result.reynolds_number > 2300 else 'Laminar'}")
        
        # 2. Calculate required pump head (including pressure drop)
        static_head = 25  # m
        safety_factor = 1.2
        required_head = static_head + (pressure_result.pressure_drop / (fluid_density * 9.81)) * safety_factor
        
        print(f"\n⚙️  Pump Requirements:")
        print(f"   Static Head: {static_head} m")
        print(f"   Dynamic Head: {pressure_result.pressure_drop / (fluid_density * 9.81):.1f} m")
        print(f"   Required Head (with safety): {required_head:.1f} m")
        
        # 3. Analyze pump performance
        pump_efficiency = 0.78
        pump_power = 8000  # W
        
        pump_result = client.pumps.performance(
            flow_rate=flow_rate,
            head=required_head,
            efficiency=pump_efficiency,
            power=pump_power,
        )
        
        print(f"\n🔋 Pump Performance:")
        print(f"   Hydraulic Power: {pump_result.hydraulic_power:.2f} kW")
        print(f"   Brake Power: {pump_result.brake_power:.2f} kW")
        print(f"   Specific Speed: {pump_result.specific_speed:.4f}")
        print(f"   Overall Efficiency: {pump_result.efficiency:.1%}")
        
        # 4. NPSH check
        npsh_result = client.pumps.npsh(
            suction_pressure=101325,  # Atmospheric
            vapor_pressure=2337,      # Water at 20°C
            fluid_density=fluid_density,
            suction_velocity=pressure_result.velocity * 0.8,  # Suction velocity (80% of discharge)
            suction_losses=2.0,       # Estimated suction losses
        )
        
        print(f"\n🌊 NPSH Analysis:")
        print(f"   NPSH Available: {npsh_result.npsh_available:.2f} m")
        print(f"   NPSH Required: {npsh_result.npsh_required:.2f} m")
        print(f"   Safety Margin: {npsh_result.margin:.2f} m")
        print(f"   Cavitation Risk: {'⚠️  YES - Increase suction pipe size' if npsh_result.is_cavitation_risk else '✅ NO - Safe operation'}")
        
        # 5. System summary
        print(f"\n📋 System Summary:")
        print(f"   Flow Rate: {flow_rate} m³/s ({flow_rate * 3600:.0f} m³/h)")
        print(f"   Pipe Size: DN{pipe_diameter*1000:.0f} ({pipe_diameter} m)")
        print(f"   Total Head: {required_head:.1f} m")
        print(f"   Power Required: {pump_result.brake_power:.2f} kW")
        print(f"   System Status: {'✅ Optimal' if not npsh_result.is_cavitation_risk and pressure_result.velocity < 3.0 else '⚠️  Needs optimization'}")
        
    except Exception as e:
        print(f"❌ System analysis failed: {e}")


def main():
    """Run all advanced examples."""
    print("🐍 EngiVault Python SDK - Advanced Examples")
    print("=" * 50)
    
    try:
        pipe_sizing_analysis()
        pump_comparison()
        npsh_safety_check()
        system_analysis()
        
        print("\n🎉 All advanced examples completed successfully!")
        print("📚 Visit https://engivault-api-production.up.railway.app/documentation for more API details")
        
    except Exception as e:
        print(f"❌ Examples failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
