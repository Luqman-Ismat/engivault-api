"""
EngiVault Python SDK - Basic Usage Examples

This example demonstrates how to use the EngiVault Python SDK
for common engineering calculations.
"""

import os
from engivault import EngiVault

def main():
    """Run basic usage examples."""
    
    # Initialize client with JWT token (from your login)
    # In production, use API key instead
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRjNjlhMi03NmNiLTRhYmEtYjViNi1jNzQ1YTk0YmM3NmQiLCJlbWFpbCI6ImFkbWluQGVuZ2l2YXVsdC5jb20iLCJpYXQiOjE3NTgwNDMxMjUsImV4cCI6MTc1ODY0NzkyNX0.eraKSPQN-YYZ6WUTjhbELVACJuWL_DaovOgVI_H-UTE"
    
    client = EngiVault(jwt_token=jwt_token)
    
    print("🔧 EngiVault Python SDK - Basic Usage Examples")
    print("=" * 50)
    
    # Example 1: Pressure Drop Calculation
    print("\n1. 💧 Pressure Drop Calculation")
    print("-" * 30)
    
    try:
        result = client.hydraulics.pressure_drop(
            flow_rate=0.1,           # m³/s
            pipe_diameter=0.1,       # meters
            pipe_length=100,         # meters
            fluid_density=1000,      # kg/m³ (water)
            fluid_viscosity=0.001,   # Pa·s (water at 20°C)
        )
        
        print(f"✅ Pressure Drop: {result.pressure_drop:,.2f} Pa")
        print(f"   Reynolds Number: {result.reynolds_number:,.0f}")
        print(f"   Friction Factor: {result.friction_factor:.6f}")
        print(f"   Velocity: {result.velocity:.2f} m/s")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Example 2: Pump Performance Calculation
    print("\n2. ⚙️  Pump Performance Calculation")
    print("-" * 35)
    
    try:
        result = client.pumps.performance(
            flow_rate=0.05,    # m³/s
            head=50,           # meters
            efficiency=0.8,    # 80%
            power=5000,        # watts
        )
        
        print(f"✅ Hydraulic Power: {result.hydraulic_power:.3f} kW")
        print(f"   Brake Power: {result.brake_power:.3f} kW")
        print(f"   Specific Speed: {result.specific_speed:.6f}")
        print(f"   Efficiency: {result.efficiency:.1%}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Example 3: NPSH Calculation
    print("\n3. 🌊 NPSH Calculation")
    print("-" * 25)
    
    try:
        result = client.pumps.npsh(
            suction_pressure=101325,  # Pa (atmospheric)
            vapor_pressure=2337,      # Pa (water at 20°C)
            fluid_density=1000,       # kg/m³
            suction_velocity=2.0,     # m/s
            suction_losses=1.5,       # meters
        )
        
        print(f"✅ NPSH Available: {result.npsh_available:.2f} m")
        print(f"   NPSH Required: {result.npsh_required:.2f} m")
        print(f"   Margin: {result.margin:.2f} m")
        print(f"   Cavitation Risk: {'⚠️  YES' if result.is_cavitation_risk else '✅ NO'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Example 4: Usage Analytics
    print("\n4. 📊 Usage Analytics")
    print("-" * 22)
    
    try:
        stats = client.analytics.usage_stats()
        
        print(f"✅ Total Requests: {stats.total_requests}")
        print(f"   Requests Today: {stats.requests_today}")
        print(f"   Requests This Month: {stats.requests_this_month}")
        print(f"   Average Response Time: {stats.average_response_time:.2f} ms")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Example 5: Subscription Limits
    print("\n5. 💳 Subscription Limits")
    print("-" * 25)
    
    try:
        limits = client.analytics.subscription_limits()
        
        print(f"✅ Subscription Tier: {limits['subscriptionTier']}")
        print(f"   Monthly Limit: {limits['requestsPerMonth']}")
        print(f"   Used This Month: {limits['requestsUsedThisMonth']}")
        print(f"   Remaining: {limits['remainingRequestsThisMonth']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n🎉 All examples completed!")
    print("📚 For more examples, visit: https://engivault-api-production.up.railway.app/documentation")


if __name__ == "__main__":
    main()
