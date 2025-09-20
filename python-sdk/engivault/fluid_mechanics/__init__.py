"""
EngiVault Fluid Mechanics Module

Advanced fluid mechanics calculations including open channel flow, compressible flow,
boundary layer analysis, and external flow over objects.
"""

from typing import TYPE_CHECKING, Optional, Dict, Any

from ..models import (
    OpenChannelFlowInput,
    OpenChannelFlowResult,
    CompressibleFlowInput,
    CompressibleFlowResult,
    BoundaryLayerInput,
    BoundaryLayerResult,
    ExternalFlowInput,
    ExternalFlowResult,
)
from ..exceptions import SDKValidationError

if TYPE_CHECKING:
    from ..client import EngiVaultClient


class FluidMechanicsModule:
    """Fluid mechanics calculations module."""
    
    def __init__(self, client: "EngiVaultClient"):
        self.client = client
    
    def open_channel_flow(
        self,
        flow_rate: float,
        channel_width: float,
        channel_slope: float,
        mannings_coeff: float,
        channel_shape: Optional[str] = None,
        side_slope: Optional[float] = None,
    ) -> OpenChannelFlowResult:
        """
        Calculate open channel flow using Manning's equation.
        
        Args:
            flow_rate: Flow rate in m³/s
            channel_width: Channel width in m
            channel_slope: Channel slope (dimensionless, S₀)
            mannings_coeff: Manning's roughness coefficient
            channel_shape: Channel shape ('rectangular', 'trapezoidal', 'circular')
            side_slope: Side slope for trapezoidal (m:1)
            
        Returns:
            OpenChannelFlowResult with depth, velocity, Froude number, and hydraulic properties
            
        Example:
            >>> result = client.fluid_mechanics.open_channel_flow(
            ...     flow_rate=5.0,
            ...     channel_width=3.0,
            ...     channel_slope=0.001,
            ...     mannings_coeff=0.03
            ... )
            >>> print(f"Normal depth: {result.normal_depth:.2f} m")
            >>> print(f"Flow regime: {result.flow_regime}")
        """
        # Validate inputs
        try:
            input_data = OpenChannelFlowInput(
                flow_rate=flow_rate,
                channel_width=channel_width,
                channel_slope=channel_slope,
                mannings_s_coeff=mannings_coeff,
                channel_shape=channel_shape or "rectangular",
                side_slope=side_slope or 0,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/open-channel-flow",
            data=input_data.model_dump(by_alias=True),
        )
        
        # Parse and return result
        return OpenChannelFlowResult(**response_data)
    
    def compressible_flow(
        self,
        temperature: float,
        pressure: float,
        gas_properties: Dict[str, float],
        mach_number: Optional[float] = None,
        velocity: Optional[float] = None,
        flow_type: Optional[str] = None,
    ) -> CompressibleFlowResult:
        """
        Calculate compressible flow properties using isentropic relations.
        
        Args:
            temperature: Temperature in K
            pressure: Pressure in Pa
            gas_properties: Dict with 'gamma', 'gasConstant', 'molecularWeight'
            mach_number: Mach number (if known)
            velocity: Velocity in m/s (if Mach number unknown)
            flow_type: Flow type ('isentropic', 'fanno', 'rayleigh')
            
        Returns:
            CompressibleFlowResult with Mach number, stagnation properties, and flow regime
            
        Example:
            >>> gas_props = {
            ...     'gamma': 1.4,
            ...     'gasConstant': 287,
            ...     'molecularWeight': 28.97
            ... }
            >>> result = client.fluid_mechanics.compressible_flow(
            ...     temperature=288,
            ...     pressure=101325,
            ...     gas_properties=gas_props,
            ...     velocity=100
            ... )
            >>> print(f"Mach number: {result.mach_number:.2f}")
            >>> print(f"Flow regime: {result.flow_regime}")
        """
        # Validate inputs
        if mach_number is None and velocity is None:
            raise SDKValidationError("Either mach_number or velocity must be provided")
        
        try:
            input_data = CompressibleFlowInput(
                temperature=temperature,
                pressure=pressure,
                gas_properties=gas_properties,
                mach_number=mach_number,
                velocity=velocity,
                flow_type=flow_type or "isentropic",
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/compressible-flow",
            data=input_data.model_dump(by_alias=True, exclude_none=True),
        )
        
        # Parse and return result
        return CompressibleFlowResult(**response_data)
    
    def boundary_layer(
        self,
        velocity: float,
        distance: float,
        fluid_properties: Dict[str, float],
        surface_roughness: Optional[float] = None,
        plate_length: Optional[float] = None,
    ) -> BoundaryLayerResult:
        """
        Calculate boundary layer properties for flat plate.
        
        Args:
            velocity: Free stream velocity in m/s
            distance: Distance from leading edge in m
            fluid_properties: Dict with 'density', 'viscosity', 'kinematicViscosity'
            surface_roughness: Surface roughness in m
            plate_length: Total plate length in m
            
        Returns:
            BoundaryLayerResult with thickness, friction coefficient, and flow regime
            
        Example:
            >>> fluid_props = {
            ...     'density': 1.225,
            ...     'viscosity': 1.81e-5,
            ...     'kinematicViscosity': 1.48e-5
            ... }
            >>> result = client.fluid_mechanics.boundary_layer(
            ...     velocity=10,
            ...     distance=0.5,
            ...     fluid_properties=fluid_props
            ... )
            >>> print(f"Boundary layer thickness: {result.boundary_layer_thickness*1000:.2f} mm")
            >>> print(f"Flow regime: {result.flow_regime}")
        """
        # Validate inputs
        try:
            input_data = BoundaryLayerInput(
                velocity=velocity,
                distance=distance,
                fluid_properties=fluid_properties,
                surface_roughness=surface_roughness,
                plate_length=plate_length,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/boundary-layer",
            data=input_data.model_dump(by_alias=True, exclude_none=True),
        )
        
        # Parse and return result
        return BoundaryLayerResult(**response_data)
    
    def external_flow(
        self,
        velocity: float,
        characteristic_length: float,
        fluid_properties: Dict[str, float],
        geometry: str,
        angle_of_attack: Optional[float] = None,
    ) -> ExternalFlowResult:
        """
        Calculate external flow drag and lift coefficients.
        
        Args:
            velocity: Free stream velocity in m/s
            characteristic_length: Characteristic length in m
            fluid_properties: Dict with 'density', 'viscosity'
            geometry: Object geometry ('sphere', 'cylinder', 'flat_plate', 'airfoil')
            angle_of_attack: Angle of attack in degrees (for airfoil)
            
        Returns:
            ExternalFlowResult with drag/lift coefficients and forces
            
        Example:
            >>> fluid_props = {'density': 1.225, 'viscosity': 1.81e-5}
            >>> result = client.fluid_mechanics.external_flow(
            ...     velocity=20,
            ...     characteristic_length=0.1,
            ...     fluid_properties=fluid_props,
            ...     geometry="sphere"
            ... )
            >>> print(f"Drag coefficient: {result.drag_coefficient:.3f}")
            >>> print(f"Drag force: {result.drag_force:.2f} N")
        """
        # Validate inputs
        try:
            input_data = ExternalFlowInput(
                velocity=velocity,
                characteristic_length=characteristic_length,
                fluid_properties=fluid_properties,
                geometry=geometry,
                angle_of_attack=angle_of_attack,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/external-flow",
            data=input_data.model_dump(by_alias=True, exclude_none=True),
        )
        
        # Parse and return result
        return ExternalFlowResult(**response_data)
    
    def normal_shock(
        self,
        mach_number_1: float,
        gamma: float = 1.4,
    ) -> Dict[str, float]:
        """
        Calculate normal shock wave properties.
        
        Args:
            mach_number_1: Upstream Mach number (must be > 1)
            gamma: Specific heat ratio (default: 1.4 for air)
            
        Returns:
            Dict with downstream Mach number and property ratios
            
        Example:
            >>> result = client.fluid_mechanics.normal_shock(
            ...     mach_number_1=2.0,
            ...     gamma=1.4
            ... )
            >>> print(f"Downstream Mach: {result['machNumber2']:.3f}")
            >>> print(f"Pressure ratio: {result['pressureRatio']:.2f}")
        """
        if mach_number_1 <= 1.0:
            raise SDKValidationError("Normal shock requires supersonic upstream flow (M₁ > 1)")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/normal-shock",
            data={"machNumber1": mach_number_1, "gamma": gamma},
        )
        
        return response_data
    
    def choked_flow(
        self,
        stagnation_temperature: float,
        stagnation_pressure: float,
        gamma: float = 1.4,
        gas_constant: float = 287,
    ) -> Dict[str, float]:
        """
        Calculate choked flow properties (critical conditions).
        
        Args:
            stagnation_temperature: Stagnation temperature in K
            stagnation_pressure: Stagnation pressure in Pa
            gamma: Specific heat ratio (default: 1.4)
            gas_constant: Specific gas constant in J/kg·K (default: 287 for air)
            
        Returns:
            Dict with critical temperature, pressure, density, velocity, and mass flow rate
            
        Example:
            >>> result = client.fluid_mechanics.choked_flow(
            ...     stagnation_temperature=300,
            ...     stagnation_pressure=200000
            ... )
            >>> print(f"Critical velocity: {result['criticalVelocity']:.1f} m/s")
            >>> print(f"Mass flow rate: {result['massFlowRate']:.2f} kg/s·m²")
        """
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/fluid-mechanics/choked-flow",
            data={
                "stagnationTemperature": stagnation_temperature,
                "stagnationPressure": stagnation_pressure,
                "gamma": gamma,
                "gasConstant": gas_constant
            },
        )
        
        return response_data
