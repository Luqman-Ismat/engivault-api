"""
EngiVault Hydraulics Module

Hydraulic calculations including pressure drop and flow rate analysis.
"""

from typing import TYPE_CHECKING, Optional

from ..models import (
    PressureDropInput,
    PressureDropResult,
    FlowRateInput,
    FlowRateResult,
)
from ..exceptions import SDKValidationError

if TYPE_CHECKING:
    from ..client import EngiVaultClient


class HydraulicsModule:
    """Hydraulics calculations module."""
    
    def __init__(self, client: "EngiVaultClient"):
        self.client = client
    
    def pressure_drop(
        self,
        flow_rate: float,
        pipe_diameter: float,
        pipe_length: float,
        fluid_density: float,
        fluid_viscosity: float,
        pipe_roughness: Optional[float] = None,
    ) -> PressureDropResult:
        """
        Calculate pressure drop using the Darcy-Weisbach equation.
        
        Args:
            flow_rate: Flow rate in m³/s
            pipe_diameter: Pipe diameter in meters
            pipe_length: Pipe length in meters
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            pipe_roughness: Pipe roughness in meters (optional, default: 0.00015)
            
        Returns:
            PressureDropResult with pressure drop, Reynolds number, friction factor, and velocity
            
        Example:
            >>> result = client.hydraulics.pressure_drop(
            ...     flow_rate=0.1,
            ...     pipe_diameter=0.1,
            ...     pipe_length=100,
            ...     fluid_density=1000,
            ...     fluid_viscosity=0.001
            ... )
            >>> print(f"Pressure drop: {result.pressure_drop:.2f} Pa")
        """
        # Validate inputs
        try:
            input_data = PressureDropInput(
                flow_rate=flow_rate,
                pipe_diameter=pipe_diameter,
                pipe_length=pipe_length,
                fluid_density=fluid_density,
                fluid_viscosity=fluid_viscosity,
                pipe_roughness=pipe_roughness or 0.00015,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/hydraulics/pressure-drop",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return PressureDropResult(**response_data)
    
    def flow_rate(
        self,
        pressure_drop: float,
        pipe_diameter: float,
        pipe_length: float,
        fluid_density: float,
        fluid_viscosity: float,
        pipe_roughness: Optional[float] = None,
    ) -> FlowRateResult:
        """
        Calculate flow rate from pressure drop using iterative method.
        
        Args:
            pressure_drop: Pressure drop in Pa
            pipe_diameter: Pipe diameter in meters
            pipe_length: Pipe length in meters
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            pipe_roughness: Pipe roughness in meters (optional, default: 0.00015)
            
        Returns:
            FlowRateResult with flow rate, velocity, and Reynolds number
            
        Example:
            >>> result = client.hydraulics.flow_rate(
            ...     pressure_drop=10000,
            ...     pipe_diameter=0.1,
            ...     pipe_length=100,
            ...     fluid_density=1000,
            ...     fluid_viscosity=0.001
            ... )
            >>> print(f"Flow rate: {result.flow_rate:.4f} m³/s")
        """
        # Validate inputs
        try:
            input_data = FlowRateInput(
                pressure_drop=pressure_drop,
                pipe_diameter=pipe_diameter,
                pipe_length=pipe_length,
                fluid_density=fluid_density,
                fluid_viscosity=fluid_viscosity,
                pipe_roughness=pipe_roughness or 0.00015,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/hydraulics/flow-rate",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return FlowRateResult(**response_data)
