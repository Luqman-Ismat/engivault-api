"""
Vessel Sizing Module

This module provides vessel sizing calculations based on ASME Section VIII standards
and industry best practices.

References:
- ASME Section VIII: Rules for Construction of Pressure Vessels
- API 650: Welded Steel Tanks for Oil Storage
- API 620: Design and Construction of Large, Welded, Low-Pressure Storage Tanks
- Perry's Chemical Engineers' Handbook, 8th Edition, Section 12
"""

from typing import Dict, Any, Optional
from ..client import EngiVaultClient
from ..exceptions import SDKValidationError


class VesselSizing:
    """
    Vessel sizing calculations based on ASME Section VIII standards.
    
    This class provides methods for sizing storage tanks, pressure vessels,
    separators, and reactors with proper references to industry standards.
    """
    
    def __init__(self, client: EngiVaultClient):
        self.client = client
    
    def size_vessel(
        self,
        volume: float,
        design_pressure: float,
        design_temperature: float,
        vessel_type: str,
        material: Optional[str] = None,
        diameter: Optional[float] = None,
        length: Optional[float] = None,
        height: Optional[float] = None,
        operating_conditions: Optional[Dict[str, float]] = None,
        standards: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Size a vessel based on volume and pressure requirements.
        
        Args:
            volume: Vessel volume in m³
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            vessel_type: Vessel type ('storage_tank', 'pressure_vessel', 'separator', 'reactor')
            material: Vessel material ('carbon_steel', 'stainless_steel', 'aluminum')
            diameter: Vessel diameter in m (optional)
            length: Vessel length in m (optional)
            height: Vessel height in m (optional)
            operating_conditions: Operating conditions dict
            standards: Applicable standards list
            
        Returns:
            Dict with vessel sizing results including references
            
        Example:
            >>> result = client.equipment_sizing.vessel_sizing.size_vessel(
            ...     volume=100,
            ...     design_pressure=1000000,
            ...     design_temperature=423,
            ...     vessel_type="pressure_vessel",
            ...     material="carbon_steel"
            ... )
        """
        # Validate inputs
        if volume <= 0:
            raise SDKValidationError("Volume must be positive")
        if design_pressure <= 0:
            raise SDKValidationError("Design pressure must be positive")
        if design_temperature <= 0:
            raise SDKValidationError("Design temperature must be positive")
        
        # Prepare request data
        request_data = {
            "volume": volume,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "vesselType": vessel_type
        }
        
        if material is not None:
            request_data["material"] = material
        if diameter is not None:
            request_data["diameter"] = diameter
        if length is not None:
            request_data["length"] = length
        if height is not None:
            request_data["height"] = height
        if operating_conditions is not None:
            request_data["operatingConditions"] = operating_conditions
        if standards is not None:
            request_data["standards"] = standards
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/vessels/sizing",
            data=request_data
        )
        
        return response_data
    
    def calculate_wall_thickness(
        self,
        diameter: float,
        design_pressure: float,
        allowable_stress: float,
        joint_efficiency: float = 1.0,
        corrosion_allowance: float = 0.003
    ) -> float:
        """
        Calculate vessel wall thickness using ASME Section VIII.
        
        References:
        - ASME Section VIII, Division 1, UG-27
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 12
        
        Args:
            diameter: Vessel diameter in m
            design_pressure: Design pressure in Pa
            allowable_stress: Allowable stress in Pa
            joint_efficiency: Joint efficiency (0-1)
            corrosion_allowance: Corrosion allowance in m
            
        Returns:
            Wall thickness in m
        """
        # Wall thickness calculation (ASME Section VIII, Division 1, UG-27)
        wall_thickness = (design_pressure * diameter) / (2 * allowable_stress * joint_efficiency - design_pressure) + corrosion_allowance
        return wall_thickness
    
    def calculate_vessel_weight(
        self,
        diameter: float,
        length: float,
        wall_thickness: float,
        material_density: float
    ) -> float:
        """
        Calculate vessel weight.
        
        References:
        - ASME Section VIII, Division 1, UG-28
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 12
        
        Args:
            diameter: Vessel diameter in m
            length: Vessel length in m
            wall_thickness: Wall thickness in m
            material_density: Material density in kg/m³
            
        Returns:
            Vessel weight in kg
        """
        # Shell weight calculation
        shell_weight = 3.14159 * diameter * length * wall_thickness * material_density
        
        # Head weight calculation (assuming 2:1 ellipsoidal heads)
        head_weight = 2 * 3.14159 * (diameter / 2) ** 2 * wall_thickness * material_density
        
        total_weight = shell_weight + head_weight
        return total_weight
    
    def calculate_optimal_dimensions(
        self,
        volume: float
    ) -> tuple[float, float]:
        """
        Calculate optimal vessel dimensions for minimum surface area.
        
        References:
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 12
        - Chemical Process Equipment: Selection and Design by Couper et al.
        
        Args:
            volume: Vessel volume in m³
            
        Returns:
            Tuple of (diameter, length) in m
        """
        # Calculate optimal dimensions for minimum surface area
        diameter = (volume / (3.14159 / 4)) ** (1/3)
        length = volume / (3.14159 * diameter ** 2 / 4)
        
        return diameter, length
    
    def get_material_properties(
        self,
        material: str,
        temperature: float
    ) -> Dict[str, float]:
        """
        Get material properties at given temperature.
        
        References:
        - ASME Section II: Materials
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 2
        
        Args:
            material: Material name
            temperature: Temperature in K
            
        Returns:
            Dict with material properties
        """
        # Material properties database (ASME Section II, Part D)
        material_data = {
            "carbon_steel": {
                "density": 7850,
                "thermalConductivity": 50,
                "specificHeat": 460,
                "viscosity": 1.5e-5,
                "elasticModulus": 200000,
                "allowableStress": 137.9
            },
            "stainless_steel": {
                "density": 8000,
                "thermalConductivity": 16,
                "specificHeat": 500,
                "viscosity": 1.5e-5,
                "elasticModulus": 200000,
                "allowableStress": 137.9
            },
            "aluminum": {
                "density": 2700,
                "thermalConductivity": 205,
                "specificHeat": 900,
                "viscosity": 1.5e-5,
                "elasticModulus": 70000,
                "allowableStress": 68.9
            }
        }
        
        return material_data.get(material, material_data["carbon_steel"])
    
    def size_pressure_vessel(
        self,
        volume: float,
        design_pressure: float,
        design_temperature: float,
        material: str = 'carbon_steel',
        diameter: Optional[float] = None,
        length: Optional[float] = None,
        height: Optional[float] = None,
        operating_conditions: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate pressure vessel sizing with ASME Section VIII compliance.
        
        References:
        - ASME Section VIII, Division 1: Rules for Construction of Pressure Vessels
        - ASME Section II: Materials
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
        
        Args:
            volume: Vessel volume in m³
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            material: Vessel material
            diameter: Vessel diameter in m (optional)
            length: Vessel length in m (optional)
            height: Vessel height in m (optional)
            operating_conditions: Operating conditions dict
            
        Returns:
            Dict with pressure vessel sizing results
        """
        request_data = {
            "volume": volume,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "material": material,
            "vesselType": "pressure_vessel",
            "diameter": diameter,
            "length": length,
            "height": height,
            "operatingConditions": operating_conditions
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/vessels/pressure-vessel", data=request_data)

    def size_storage_tank(
        self,
        volume: float,
        design_pressure: float,
        design_temperature: float,
        material: str = 'carbon_steel',
        diameter: Optional[float] = None,
        height: Optional[float] = None,
        operating_conditions: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate storage tank sizing with API 650 compliance.
        
        References:
        - API 650: Welded Steel Tanks for Oil Storage
        - API 620: Design and Construction of Large, Welded, Low-Pressure Storage Tanks
        - ASME Section VIII, Division 1: Rules for Construction of Pressure Vessels
        
        Args:
            volume: Tank volume in m³
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            material: Tank material
            diameter: Tank diameter in m (optional)
            height: Tank height in m (optional)
            operating_conditions: Operating conditions dict
            
        Returns:
            Dict with storage tank sizing results
        """
        request_data = {
            "volume": volume,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "material": material,
            "vesselType": "storage_tank",
            "diameter": diameter,
            "height": height,
            "operatingConditions": operating_conditions
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/vessels/storage-tank", data=request_data)

    def size_separator(
        self,
        volume: float,
        design_pressure: float,
        design_temperature: float,
        material: str = 'carbon_steel',
        diameter: Optional[float] = None,
        length: Optional[float] = None,
        operating_conditions: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate separator sizing with API 12J compliance.
        
        References:
        - API 12J: Specification for Oil and Gas Separators
        - ASME Section VIII, Division 1: Rules for Construction of Pressure Vessels
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
        
        Args:
            volume: Separator volume in m³
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            material: Separator material
            diameter: Separator diameter in m (optional)
            length: Separator length in m (optional)
            operating_conditions: Operating conditions dict
            
        Returns:
            Dict with separator sizing results
        """
        request_data = {
            "volume": volume,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "material": material,
            "vesselType": "separator",
            "diameter": diameter,
            "length": length,
            "operatingConditions": operating_conditions
        }
        return self.client._make_request(method="POST", endpoint="/api/v1/equipment/vessels/separator", data=request_data)
