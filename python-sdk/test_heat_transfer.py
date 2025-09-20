#!/usr/bin/env python3
"""
Test EngiVault Heat Transfer Module
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from engivault import EngiVault

def main():
    """Test heat transfer calculations."""
    
    print("🌡️ EngiVault Heat Transfer Module Test")
    print("=" * 50)
    
    # Test with your working JWT token
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRjNjlhMi03NmNiLTRhYmEtYjViNi1jNzQ1YTk0YmM3NmQiLCJlbWFpbCI6ImFkbWluQGVuZ2l2YXVsdC5jb20iLCJpYXQiOjE3NTgwNDMxMjUsImV4cCI6MTc1ODY0NzkyNX0.eraKSPQN-YYZ6WUTjhbELVACJuWL_DaovOgVI_H-UTE"
    
    client = EngiVault(jwt_token=jwt_token)
    print("✅ Client created successfully")
    
    # Test 1: LMTD Calculation
    print("\n🔥 Testing LMTD Calculation...")
    try:
        lmtd = client.heat_transfer.lmtd(
            t_hot_in=353,   # 80°C
            t_hot_out=333,  # 60°C
            t_cold_in=293,  # 20°C
            t_cold_out=313, # 40°C
            flow_arrangement="counterflow"
        )
        
        print(f"✅ LMTD: {lmtd:.2f} K")
        print(f"   Hot fluid: 80°C → 60°C (ΔT = 20K)")
        print(f"   Cold fluid: 20°C → 40°C (ΔT = 20K)")
        print(f"   Flow arrangement: Counterflow")
        
    except Exception as e:
        print(f"❌ LMTD test failed: {e}")
    
    # Test 2: Heat Exchanger Sizing
    print("\n🏭 Testing Heat Exchanger Sizing...")
    try:
        result = client.heat_transfer.heat_exchanger_area(
            heat_duty=50000,    # 50 kW
            overall_u=500,      # W/m²·K
            t_hot_in=353,       # 80°C
            t_hot_out=333,      # 60°C
            t_cold_in=293,      # 20°C
            t_cold_out=313,     # 40°C
            flow_arrangement="counterflow"
        )
        
        print(f"✅ Heat Exchanger Analysis:")
        print(f"   Required Area: {result.area:.2f} m²")
        print(f"   LMTD: {result.lmtd:.2f} K")
        print(f"   Effectiveness: {result.effectiveness:.1%}")
        print(f"   NTU: {result.ntu:.2f}")
        print(f"   Capacity Ratio: {result.capacity_ratio:.2f}")
        
    except Exception as e:
        print(f"❌ Heat exchanger test failed: {e}")
    
    # Test 3: Effectiveness-NTU Method
    print("\n📊 Testing Effectiveness-NTU Method...")
    try:
        result = client.heat_transfer.effectiveness_ntu(
            ntu=2.5,
            capacity_ratio=0.6,
            flow_arrangement="counterflow"
        )
        
        print(f"✅ Effectiveness-NTU Analysis:")
        print(f"   NTU: 2.5")
        print(f"   Capacity Ratio: 0.6")
        print(f"   Effectiveness: {result.effectiveness:.1%}")
        print(f"   Flow Arrangement: Counterflow")
        
    except Exception as e:
        print(f"❌ Effectiveness-NTU test failed: {e}")
    
    # Test 4: Complete Heat Exchanger Sizing
    print("\n🔬 Testing Complete Heat Exchanger Sizing...")
    try:
        sizing = client.heat_transfer.heat_exchanger_sizing(
            heat_duty=100000,   # 100 kW
            hot_fluid_inlet=373,  # 100°C
            hot_fluid_outlet=343, # 70°C  
            cold_fluid_inlet=288, # 15°C
            cold_fluid_outlet=318, # 45°C
            overall_u=800,       # W/m²·K
            flow_arrangement="counterflow"
        )
        
        print(f"✅ Complete Sizing Analysis:")
        print(f"   Heat Duty: {sizing['heat_duty']/1000:.0f} kW")
        print(f"   Required Area: {sizing['area']:.2f} m²")
        print(f"   LMTD: {sizing['lmtd']:.2f} K")
        print(f"   Effectiveness: {sizing['effectiveness']:.1%}")
        print(f"   Hot Capacity Rate: {sizing['hot_capacity_rate']:.0f} W/K")
        print(f"   Cold Capacity Rate: {sizing['cold_capacity_rate']:.0f} W/K")
        
    except Exception as e:
        print(f"❌ Complete sizing test failed: {e}")
    
    print("\n🎉 Heat Transfer Module testing completed!")
    print("📚 Heat transfer calculations are now available in EngiVault!")

if __name__ == "__main__":
    main()
