#!/usr/bin/env python3
"""
Example usage of EngiVault Python SDK
"""

from client import EngiVaultClient
from models import *

def main():
    # Create client instance
    client = EngiVaultClient(base_url="http://localhost:3000")
    
    try:
        # Example 1: Check health (this should always work)
        print("🏥 Checking health...")
        health_result = client.get_health()
        print("Health check result:", health_result)
        
        # Example 2: Fit pump curve (this endpoint works)
        print("\n📈 Fitting pump curve...")
        curve_fit_result = client.fit_pump_curve({
            "points": [
                {"q": 10, "h": 94.5},
                {"q": 20, "h": 88},
                {"q": 30, "h": 80.5},
                {"q": 40, "h": 72},
                {"q": 50, "h": 62.5}
            ],
            "model": "quadratic"
        })
        print("Curve fit result:", curve_fit_result)
        
        # Example 3: Calculate fill/drain time
        print("\n⏱️ Calculating fill/drain time...")
        fill_drain_result = client.calculate_fill_drain_time({
            "tank_volume": 100,
            "Q": 0.1,
            "operation": "fill"
        })
        print("Fill/drain time result:", fill_drain_result)
        
        # Example 4: Calculate gas flow
        print("\n💨 Calculating gas flow...")
        gas_flow_result = client.calculate_gas_flow({
            "P1": 1000000,
            "P2": 500000,
            "L": 100,
            "D": 0.1,
            "T": 293,
            "gas": "air",
            "flow_type": "isothermal"
        })
        print("Gas flow result:", gas_flow_result)
        
        # Example 5: Calculate Fanno line
        print("\n📊 Calculating Fanno line...")
        fanno_result = client.calculate_fanno_line({
            "P1": 1000000,
            "T1": 293,
            "L": 100,
            "D": 0.1,
            "f": 0.02,
            "gas": "air"
        })
        print("Fanno line result:", fanno_result)
        
        # Example 6: Calculate Rayleigh line
        print("\n📈 Calculating Rayleigh line...")
        rayleigh_result = client.calculate_rayleigh_line({
            "P1": 1000000,
            "T1": 293,
            "qdot": 1000,
            "gas": "air"
        })
        print("Rayleigh line result:", rayleigh_result)
        
        # Example 7: Calculate viscosity adjusted drop
        print("\n🌡️ Calculating viscosity adjusted drop...")
        viscosity_result = client.calculate_viscosity_adjusted_drop({
            "Q": 0.1,
            "L": 100,
            "D": 0.1,
            "roughness": 0.000045,
            "fluid": "water",
            "T_in": 293,
            "T_out": 313
        })
        print("Viscosity adjusted drop result:", viscosity_result)
        
        # Example 8: Calculate heat exchanger pressure drop
        print("\n🔥 Calculating heat exchanger pressure drop...")
        hx_result = client.calculate_hx_pressure_drop({
            "geometry": "shell_and_tube",
            "passes": 2,
            "massFlux": 1000,
            "fluidSide": "tube"
        })
        print("Heat exchanger pressure drop result:", hx_result)
        
    except Exception as error:
        print(f"❌ Error: {error}")

if __name__ == "__main__":
    main()
