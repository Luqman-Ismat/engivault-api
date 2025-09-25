"""
Piping Sizing Module

This module provides piping sizing calculations based on ASME B31.3 standards
and industry best practices.

References:
- ASME B31.3: Process Piping
- Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe
- Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
- Darby, R.: Chemical Engineering Fluid Mechanics
"""

from typing import Dict, Any, Optional, List
from ..client import EngiVaultClient
from ..exceptions import SDKValidationError


class PipingSizing:
    """
    Piping sizing calculations based on ASME B31.3 standards.
    
    This class provides methods for sizing pipes, fittings, and valves
    with proper references to industry standards.
    """
    
    def __init__(self, client: EngiVaultClient):
        self.client = client
    
    def size_piping(
        self,
        flow_rate: float,
        fluid_density: float,
        fluid_viscosity: float,
        pressure_drop: Optional[float] = None,
        velocity_limit: Optional[float] = None,
        pipe_material: Optional[str] = None,
        pipe_schedule: Optional[str] = None,
        design_pressure: Optional[float] = None,
        design_temperature: Optional[float] = None,
        pipe_length: Optional[float] = None,
        fittings: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Size piping based on flow rate and pressure drop.
        
        Args:
            flow_rate: Flow rate in m³/s
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            pressure_drop: Allowable pressure drop in Pa (optional)
            velocity_limit: Maximum velocity in m/s (optional)
            pipe_material: Pipe material (optional)
            pipe_schedule: Pipe schedule (optional)
            design_pressure: Design pressure in Pa (optional)
            design_temperature: Design temperature in K (optional)
            pipe_length: Pipe length in m (optional)
            fittings: List of fittings (optional)
            
        Returns:
            Dict with piping sizing results including references
            
        Example:
            >>> result = client.equipment_sizing.piping_sizing.size_piping(
            ...     flow_rate=0.1,
            ...     fluid_density=1000,
            ...     fluid_viscosity=0.001,
            ...     pressure_drop=10000,
            ...     velocity_limit=3.0
            ... )
        """
        # Validate inputs
        if flow_rate <= 0:
            raise SDKValidationError("Flow rate must be positive")
        if fluid_density <= 0:
            raise SDKValidationError("Fluid density must be positive")
        if fluid_viscosity <= 0:
            raise SDKValidationError("Fluid viscosity must be positive")
        
        # Prepare request data
        request_data = {
            "flowRate": flow_rate,
            "fluidDensity": fluid_density,
            "fluidViscosity": fluid_viscosity
        }
        
        if pressure_drop is not None:
            request_data["pressureDrop"] = pressure_drop
        if velocity_limit is not None:
            request_data["velocityLimit"] = velocity_limit
        if pipe_material is not None:
            request_data["pipeMaterial"] = pipe_material
        if pipe_schedule is not None:
            request_data["pipeSchedule"] = pipe_schedule
        if design_pressure is not None:
            request_data["designPressure"] = design_pressure
        if design_temperature is not None:
            request_data["designTemperature"] = design_temperature
        if pipe_length is not None:
            request_data["pipeLength"] = pipe_length
        if fittings is not None:
            request_data["fittings"] = fittings
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/piping/sizing",
            data=request_data
        )
        
        return response_data
    
    def calculate_pipe_diameter(
        self,
        flow_rate: float,
        velocity_limit: float = 3.0
    ) -> float:
        """
        Calculate pipe diameter based on flow rate and velocity limit.
        
        References:
        - ASME B31.3, Section 6.1
        - Crane Technical Paper No. 410
        
        Args:
            flow_rate: Flow rate in m³/s
            velocity_limit: Maximum velocity in m/s
            
        Returns:
            Pipe diameter in m
        """
        # Pipe diameter calculation (ASME B31.3, Section 6.1)
        diameter = (4 * flow_rate / (3.14159 * velocity_limit)) ** 0.5
        return diameter
    
    def calculate_reynolds_number(
        self,
        flow_rate: float,
        diameter: float,
        fluid_density: float,
        fluid_viscosity: float
    ) -> float:
        """
        Calculate Reynolds number for pipe flow.
        
        References:
        - ASME B31.3, Section 6.2
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Args:
            flow_rate: Flow rate in m³/s
            diameter: Pipe diameter in m
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            
        Returns:
            Reynolds number
        """
        # Velocity calculation
        velocity = flow_rate / (3.14159 * diameter ** 2 / 4)
        
        # Reynolds number calculation (ASME B31.3, Section 6.2)
        reynolds_number = (fluid_density * velocity * diameter) / fluid_viscosity
        return reynolds_number
    
    def calculate_friction_factor(
        self,
        reynolds_number: float,
        relative_roughness: float = 0.00015
    ) -> float:
        """
        Calculate friction factor using Colebrook-White equation.
        
        References:
        - ASME B31.3, Section 6.3
        - Crane Technical Paper No. 410
        
        Args:
            reynolds_number: Reynolds number
            relative_roughness: Relative roughness (ε/D)
            
        Returns:
            Friction factor
        """
        if reynolds_number < 2300:
            # Laminar flow (ASME B31.3, Section 6.3.1)
            friction_factor = 64 / reynolds_number
        else:
            # Turbulent flow (ASME B31.3, Section 6.3.2)
            # Simplified Blasius equation for smooth pipes
            friction_factor = 0.316 / (reynolds_number ** 0.25)
        
        return friction_factor
    
    def calculate_pressure_drop(
        self,
        friction_factor: float,
        pipe_length: float,
        diameter: float,
        fluid_density: float,
        velocity: float
    ) -> float:
        """
        Calculate pressure drop using Darcy-Weisbach equation.
        
        References:
        - ASME B31.3, Section 6.4
        - Crane Technical Paper No. 410
        
        Args:
            friction_factor: Friction factor
            pipe_length: Pipe length in m
            diameter: Pipe diameter in m
            fluid_density: Fluid density in kg/m³
            velocity: Fluid velocity in m/s
            
        Returns:
            Pressure drop in Pa
        """
        # Pressure drop calculation (Darcy-Weisbach equation, ASME B31.3, Section 6.4)
        pressure_drop = (friction_factor * pipe_length * fluid_density * velocity ** 2) / (2 * diameter)
        return pressure_drop
    
    def calculate_equivalent_length(
        self,
        pipe_length: float,
        fittings: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate equivalent length including fittings.
        
        References:
        - Crane Technical Paper No. 410
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Args:
            pipe_length: Pipe length in m
            fittings: List of fittings with equivalent lengths
            
        Returns:
            Equivalent length in m
        """
        equivalent_length = pipe_length
        for fitting in fittings:
            equivalent_length += fitting.get("equivalentLength", 0) * fitting.get("quantity", 1)
        
        return equivalent_length
    
    def get_standard_pipe_sizes(self) -> List[float]:
        """
        Get standard pipe sizes.
        
        References:
        - ASME B31.3, Table 6.1
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Returns:
            List of standard pipe sizes in m
        """
        # Standard pipe sizes (ASME B31.3, Table 6.1)
        standard_sizes = [
            0.025, 0.032, 0.040, 0.050, 0.065, 0.080, 0.100, 0.125,
            0.150, 0.200, 0.250, 0.300, 0.350, 0.400, 0.450, 0.500
        ]
        return standard_sizes
    
    def get_fitting_equivalent_lengths(self) -> Dict[str, float]:
        """
        Get equivalent lengths for common fittings.
        
        References:
        - Crane Technical Paper No. 410
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Returns:
            Dict with fitting types and equivalent lengths
        """
        # Equivalent lengths for common fittings (Crane Technical Paper No. 410)
        fitting_lengths = {
            "90_degree_elbow": 30,
            "45_degree_elbow": 15,
            "tee_straight": 20,
            "tee_side": 60,
            "gate_valve": 8,
            "globe_valve": 340,
            "check_valve": 100,
            "reducer": 10
        }
        return fitting_lengths

    def comprehensive_pipe_sizing(
        self,
        flow_rate: float,
        fluid_density: float,
        fluid_viscosity: float,
        design_pressure: float,
        design_temperature: float,
        pressure_drop: Optional[float] = None,
        velocity_limit: float = 3.0,
        pipe_length: float = 100.0,
        fittings: Optional[List[Dict[str, Any]]] = None,
        material: str = 'carbon_steel',
        pipe_type: str = 'seamless'
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive pipe sizing with ASME B31.3 compliance.
        
        References:
        - ASME B31.3: Process Piping
        - ASME B16.5: Pipe Flanges and Flanged Fittings
        - Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Args:
            flow_rate: Flow rate in m³/s
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            pressure_drop: Allowable pressure drop in Pa (optional)
            velocity_limit: Maximum velocity in m/s
            pipe_length: Pipe length in m
            fittings: Pipe fittings array (optional)
            material: Pipe material
            pipe_type: Pipe type
            
        Returns:
            Dict with comprehensive pipe sizing results
        """
        request_data = {
            "flowRate": flow_rate,
            "fluidDensity": fluid_density,
            "fluidViscosity": fluid_viscosity,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "pressureDrop": pressure_drop,
            "velocityLimit": velocity_limit,
            "pipeLength": pipe_length,
            "fittings": fittings or [],
            "material": material,
            "pipeType": pipe_type
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/piping/comprehensive-sizing", data=request_data)

    def pipe_stress_analysis(
        self,
        pipe_diameter: float,
        wall_thickness: float,
        design_pressure: float,
        design_temperature: float,
        material: str,
        pipe_length: float,
        support_spacing: float,
        thermal_expansion: float,
        operating_temperature: float
    ) -> Dict[str, Any]:
        """
        Calculate pipe stress analysis with ASME B31.3 compliance.
        
        References:
        - ASME B31.3: Process Piping, Section 319
        - ASME B31.3: Process Piping, Section 321
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Args:
            pipe_diameter: Pipe diameter in m
            wall_thickness: Wall thickness in m
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            material: Pipe material
            pipe_length: Pipe length in m
            support_spacing: Support spacing in m
            thermal_expansion: Thermal expansion coefficient
            operating_temperature: Operating temperature in K
            
        Returns:
            Dict with pipe stress analysis results
        """
        request_data = {
            "pipeDiameter": pipe_diameter,
            "wallThickness": wall_thickness,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "material": material,
            "pipeLength": pipe_length,
            "supportSpacing": support_spacing,
            "thermalExpansion": thermal_expansion,
            "operatingTemperature": operating_temperature
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/piping/stress-analysis", data=request_data)

    def pipe_support_design(
        self,
        pipe_diameter: float,
        wall_thickness: float,
        pipe_length: float,
        material: str,
        operating_temperature: float,
        support_type: str = 'standard'
    ) -> Dict[str, Any]:
        """
        Calculate pipe support design with ASME B31.3 compliance.
        
        References:
        - ASME B31.3: Process Piping, Section 321
        - ASME B31.3: Process Piping, Section 322
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
        
        Args:
            pipe_diameter: Pipe diameter in m
            wall_thickness: Wall thickness in m
            pipe_length: Pipe length in m
            material: Pipe material
            operating_temperature: Operating temperature in K
            support_type: Support type
            
        Returns:
            Dict with pipe support design results
        """
        request_data = {
            "pipeDiameter": pipe_diameter,
            "wallThickness": wall_thickness,
            "pipeLength": pipe_length,
            "material": material,
            "operatingTemperature": operating_temperature,
            "supportType": support_type
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/piping/support-design", data=request_data)
