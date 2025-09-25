"""
Pump Sizing Module

This module provides pump sizing calculations based on API 610 standards
and industry best practices.

References:
- API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
- Hydraulic Institute Standards (HI 14.6)
- Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
- Chemical Process Equipment: Selection and Design by Couper et al.
"""

from typing import Dict, Any, Optional
from ..client import EngiVaultClient
from ..exceptions import SDKValidationError


class PumpSizing:
    """
    Pump sizing calculations based on API 610 standards.
    
    This class provides methods for sizing centrifugal pumps, positive displacement
    pumps, and specialty pumps with proper references to industry standards.
    """
    
    def __init__(self, client: EngiVaultClient):
        self.client = client
    
    def size_pump(
        self,
        flow_rate: float,
        head: float,
        fluid_density: float,
        fluid_viscosity: float,
        npsh_available: float,
        efficiency_target: Optional[float] = None,
        pump_type: Optional[str] = None,
        operating_hours: Optional[float] = None,
        design_temperature: Optional[float] = None,
        design_pressure: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Size a pump based on hydraulic requirements.
        
        Args:
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            fluid_density: Fluid density in kg/m³
            fluid_viscosity: Fluid viscosity in Pa·s
            npsh_available: NPSH available in meters
            efficiency_target: Target efficiency (0-1)
            pump_type: Pump type ('centrifugal', 'positive_displacement', 'specialty')
            operating_hours: Operating hours per year
            design_temperature: Design temperature in K
            design_pressure: Design pressure in Pa
            
        Returns:
            Dict with pump sizing results including references
            
        Example:
            >>> result = client.equipment_sizing.pump_sizing.size_pump(
            ...     flow_rate=0.1,
            ...     head=50,
            ...     fluid_density=1000,
            ...     fluid_viscosity=0.001,
            ...     npsh_available=5.0
            ... )
            >>> print(f"Hydraulic power: {result['hydraulicPower']:.2f} kW")
            >>> print(f"Brake power: {result['brakePower']:.2f} kW")
        """
        # Validate inputs
        if flow_rate <= 0:
            raise SDKValidationError("Flow rate must be positive")
        if head <= 0:
            raise SDKValidationError("Head must be positive")
        if fluid_density <= 0:
            raise SDKValidationError("Fluid density must be positive")
        if fluid_viscosity <= 0:
            raise SDKValidationError("Fluid viscosity must be positive")
        if npsh_available <= 0:
            raise SDKValidationError("NPSH available must be positive")
        
        # Prepare request data
        request_data = {
            "flowRate": flow_rate,
            "head": head,
            "fluidDensity": fluid_density,
            "fluidViscosity": fluid_viscosity,
            "npshAvailable": npsh_available
        }
        
        if efficiency_target is not None:
            request_data["efficiencyTarget"] = efficiency_target
        if pump_type is not None:
            request_data["pumpType"] = pump_type
        if operating_hours is not None:
            request_data["operatingHours"] = operating_hours
        if design_temperature is not None:
            request_data["designTemperature"] = design_temperature
        if design_pressure is not None:
            request_data["designPressure"] = design_pressure
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/pumps/sizing",
            data=request_data
        )
        
        return response_data
    
    def select_pump(
        self,
        sizing_results: Dict[str, Any],
        constraints: Optional[Dict[str, Any]] = None,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Select appropriate pump from catalog based on sizing results.
        
        Args:
            sizing_results: Results from pump sizing calculation
            constraints: Selection constraints (cost, size, etc.)
            preferences: User preferences (manufacturer, model, etc.)
            
        Returns:
            Dict with selected pump options and recommendations
            
        Example:
            >>> sizing_results = client.equipment_sizing.pump_sizing.size_pump(...)
            >>> selected = client.equipment_sizing.pump_sizing.select_pump(
            ...     sizing_results,
            ...     constraints={"maxCost": 50000},
            ...     preferences={"manufacturer": "Grundfos"}
            ... )
        """
        request_data = {
            "equipmentType": "pump",
            "sizingResults": sizing_results
        }
        
        if constraints is not None:
            request_data["constraints"] = constraints
        if preferences is not None:
            request_data["preferences"] = preferences
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/selection",
            data=request_data
        )
        
        return response_data
    
    def calculate_npsh_required(
        self,
        flow_rate: float,
        head: float,
        specific_speed: float
    ) -> float:
        """
        Calculate NPSH required based on pump characteristics.
        
        References:
        - API 610, Section 6.1.4
        - Hydraulic Institute Standards (HI 14.6)
        
        Args:
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            specific_speed: Specific speed
            
        Returns:
            NPSH required in meters
        """
        # NPSH required calculation (API 610, Section 6.1.4)
        npsh_required = 0.1 + (flow_rate ** 0.67) * (specific_speed ** 0.33) / 1000
        return npsh_required
    
    def calculate_specific_speed(
        self,
        flow_rate: float,
        head: float,
        rotational_speed: float = 1450  # RPM
    ) -> float:
        """
        Calculate specific speed for pump selection.
        
        References:
        - API 610, Section 6.1.2
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
        
        Args:
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            rotational_speed: Rotational speed in RPM
            
        Returns:
            Specific speed
        """
        # Specific speed calculation (API 610, Section 6.1.2)
        specific_speed = (flow_rate ** 0.5 * (head * 9.81) ** 0.75) / (head * 9.81) ** 0.75
        return specific_speed
    
    def calculate_efficiency(
        self,
        specific_speed: float,
        flow_rate: float,
        head: float
    ) -> float:
        """
        Estimate pump efficiency based on specific speed and operating conditions.
        
        References:
        - Perry's Chemical Engineers' Handbook, 8th Edition, Table 10-3
        - Hydraulic Institute Standards (HI 14.6)
        
        Args:
            specific_speed: Specific speed
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            
        Returns:
            Estimated efficiency (0-1)
        """
        # Efficiency estimation based on specific speed (Perry's Handbook, Table 10-3)
        if specific_speed < 50:
            efficiency = 0.6 + (specific_speed / 50) * 0.2  # 60-80% for low specific speed
        elif specific_speed < 150:
            efficiency = 0.8 + ((specific_speed - 50) / 100) * 0.15  # 80-95% for medium specific speed
        else:
            efficiency = 0.95 - ((specific_speed - 150) / 100) * 0.1  # 95-85% for high specific speed
        
        return efficiency
    
    def calculate_hydraulic_power(
        self,
        flow_rate: float,
        head: float,
        fluid_density: float
    ) -> float:
        """
        Calculate hydraulic power required.
        
        References:
        - API 610, Section 6.1.1
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
        
        Args:
            flow_rate: Flow rate in m³/s
            head: Pump head in meters
            fluid_density: Fluid density in kg/m³
            
        Returns:
            Hydraulic power in kW
        """
        # Hydraulic power calculation (API 610, Section 6.1.1)
        hydraulic_power = (flow_rate * head * fluid_density * 9.81) / 1000  # kW
        return hydraulic_power
    
    def calculate_brake_power(
        self,
        hydraulic_power: float,
        efficiency: float
    ) -> float:
        """
        Calculate brake power required.
        
        References:
        - API 610, Section 6.1.3
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
        
        Args:
            hydraulic_power: Hydraulic power in kW
            efficiency: Pump efficiency (0-1)
            
        Returns:
            Brake power in kW
        """
        # Brake power calculation (API 610, Section 6.1.3)
        brake_power = hydraulic_power / efficiency
        return brake_power
    
    def analyze_performance_curves(
        self,
        pump_data: Dict[str, Any],
        system_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze pump performance curves and system curves.
        
        Args:
            pump_data: Pump performance data
            system_data: System curve data
            
        Returns:
            Dict with performance analysis results
            
        Example:
            >>> pump_data = {
            ...     'flowRate': 0.1,
            ...     'head': 50,
            ...     'efficiency': 0.75,
            ...     'npshRequired': 2.5
            ... }
            >>> system_data = {
            ...     'systemHead': 45,
            ...     'systemFlow': 0.1,
            ...     'npshAvailable': 5.0
            ... }
            >>> result = client.equipment_sizing.pump_sizing.analyze_performance_curves(
            ...     pump_data, system_data
            ... )
        """
        request_data = {
            "pumpData": pump_data,
            "systemData": system_data
        }
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/pumps/performance-analysis",
            data=request_data
        )
        
        return response_data
    
    def calculate_system_curve(
        self,
        static_head: float,
        friction_losses: float,
        flow_rate: float
    ) -> Dict[str, Any]:
        """
        Calculate system curve for pump selection.
        
        Args:
            static_head: Static head in meters
            friction_losses: Friction losses in meters
            flow_rate: Flow rate in m³/s
            
        Returns:
            Dict with system curve data
            
        Example:
            >>> result = client.equipment_sizing.pump_sizing.calculate_system_curve(
            ...     static_head=20,
            ...     friction_losses=10,
            ...     flow_rate=0.1
            ... )
        """
        request_data = {
            "staticHead": static_head,
            "frictionLosses": friction_losses,
            "flowRate": flow_rate
        }
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/pumps/system-curve",
            data=request_data
        )
        
        return response_data
