"""
EngiVault Pumps Module

Pump performance and NPSH calculations.
"""

from typing import TYPE_CHECKING

from ..models import (
    PumpPerformanceInput,
    PumpPerformanceResult,
    NPSHInput,
    NPSHResult,
)
from ..exceptions import SDKValidationError

if TYPE_CHECKING:
    from ..client import EngiVaultClient


class PumpsModule:
    """Pump calculations module."""
    
    def __init__(self, client: "EngiVaultClient"):
        self.client = client
    
    def performance(
        self,
        flow_rate: float,
        head: float,
        efficiency: float,
        power: float,
    ) -> PumpPerformanceResult:
        """
        Calculate pump performance parameters.
        
        Args:
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            efficiency: Pump efficiency (0-1)
            power: Pump power in watts
            
        Returns:
            PumpPerformanceResult with hydraulic power, brake power, specific speed, and efficiency
            
        Example:
            >>> result = client.pumps.performance(
            ...     flow_rate=0.05,
            ...     head=50,
            ...     efficiency=0.8,
            ...     power=5000
            ... )
            >>> print(f"Hydraulic power: {result.hydraulic_power:.3f} kW")
        """
        # Validate inputs
        try:
            input_data = PumpPerformanceInput(
                flow_rate=flow_rate,
                head=head,
                efficiency=efficiency,
                power=power,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/pumps/performance",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return PumpPerformanceResult(**response_data)
    
    def npsh(
        self,
        suction_pressure: float,
        vapor_pressure: float,
        fluid_density: float,
        suction_velocity: float,
        suction_losses: float,
    ) -> NPSHResult:
        """
        Calculate Net Positive Suction Head (NPSH).
        
        Args:
            suction_pressure: Suction pressure in Pa
            vapor_pressure: Vapor pressure in Pa
            fluid_density: Fluid density in kg/m³
            suction_velocity: Suction velocity in m/s
            suction_losses: Suction losses in meters
            
        Returns:
            NPSHResult with available NPSH, required NPSH, margin, and cavitation risk
            
        Example:
            >>> result = client.pumps.npsh(
            ...     suction_pressure=101325,
            ...     vapor_pressure=2337,
            ...     fluid_density=1000,
            ...     suction_velocity=2.0,
            ...     suction_losses=1.5
            ... )
            >>> if result.is_cavitation_risk:
            ...     print("Warning: Cavitation risk detected!")
        """
        # Validate inputs
        try:
            input_data = NPSHInput(
                suction_pressure=suction_pressure,
                vapor_pressure=vapor_pressure,
                fluid_density=fluid_density,
                suction_velocity=suction_velocity,
                suction_losses=suction_losses,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/pumps/npsh",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return NPSHResult(**response_data)
