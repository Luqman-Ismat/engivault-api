"""
Heat Exchanger Sizing Module

This module provides heat exchanger sizing calculations based on TEMA standards
and industry best practices.

References:
- TEMA: Standards of Tubular Exchanger Manufacturers Association
- ASME Section VIII: Rules for Construction of Pressure Vessels
- Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
- Kern, D.Q.: Process Heat Transfer
"""

from typing import Dict, Any, Optional
from ..client import EngiVaultClient
from ..exceptions import SDKValidationError


class HeatExchangerSizing:
    """
    Heat exchanger sizing calculations based on TEMA standards.
    
    This class provides methods for sizing shell & tube, plate, air-cooled,
    and compact heat exchangers with proper references to industry standards.
    """
    
    def __init__(self, client: EngiVaultClient):
        self.client = client
    
    def size_heat_exchanger(
        self,
        heat_duty: float,
        hot_fluid_inlet: float,
        hot_fluid_outlet: float,
        cold_fluid_inlet: float,
        cold_fluid_outlet: float,
        hot_flow_rate: float,
        cold_flow_rate: float,
        design_pressure: float,
        design_temperature: float,
        hot_fluid_properties: Dict[str, float],
        cold_fluid_properties: Dict[str, float],
        exchanger_type: Optional[str] = None,
        flow_arrangement: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Size a heat exchanger based on thermal requirements.
        
        Args:
            heat_duty: Heat duty in W
            hot_fluid_inlet: Hot fluid inlet temperature in K
            hot_fluid_outlet: Hot fluid outlet temperature in K
            cold_fluid_inlet: Cold fluid inlet temperature in K
            cold_fluid_outlet: Cold fluid outlet temperature in K
            hot_flow_rate: Hot fluid flow rate in kg/s
            cold_flow_rate: Cold fluid flow rate in kg/s
            design_pressure: Design pressure in Pa
            design_temperature: Design temperature in K
            hot_fluid_properties: Hot fluid properties dict
            cold_fluid_properties: Cold fluid properties dict
            exchanger_type: Heat exchanger type ('shell_tube', 'plate', 'air_cooled', 'compact')
            flow_arrangement: Flow arrangement ('counterflow', 'parallel', 'crossflow')
            
        Returns:
            Dict with heat exchanger sizing results including references
            
        Example:
            >>> hot_props = {
            ...     'density': 1000,
            ...     'viscosity': 0.001,
            ...     'thermalConductivity': 0.6,
            ...     'specificHeat': 4180
            ... }
            >>> cold_props = {
            ...     'density': 1000,
            ...     'viscosity': 0.001,
            ...     'thermalConductivity': 0.6,
            ...     'specificHeat': 4180
            ... }
            >>> result = client.equipment_sizing.heat_exchanger_sizing.size_heat_exchanger(
            ...     heat_duty=50000,
            ...     hot_fluid_inlet=353,
            ...     hot_fluid_outlet=333,
            ...     cold_fluid_inlet=293,
            ...     cold_fluid_outlet=313,
            ...     hot_flow_rate=10,
            ...     cold_flow_rate=15,
            ...     design_pressure=1000000,
            ...     design_temperature=423,
            ...     hot_fluid_properties=hot_props,
            ...     cold_fluid_properties=cold_props
            ... )
        """
        # Validate inputs
        if heat_duty <= 0:
            raise SDKValidationError("Heat duty must be positive")
        if hot_fluid_inlet <= hot_fluid_outlet:
            raise SDKValidationError("Hot fluid inlet temperature must be greater than outlet")
        if cold_fluid_outlet <= cold_fluid_inlet:
            raise SDKValidationError("Cold fluid outlet temperature must be greater than inlet")
        
        # Prepare request data
        request_data = {
            "heatDuty": heat_duty,
            "hotFluidInlet": hot_fluid_inlet,
            "hotFluidOutlet": hot_fluid_outlet,
            "coldFluidInlet": cold_fluid_inlet,
            "coldFluidOutlet": cold_fluid_outlet,
            "hotFlowRate": hot_flow_rate,
            "coldFlowRate": cold_flow_rate,
            "designPressure": design_pressure,
            "designTemperature": design_temperature,
            "hotFluidProperties": hot_fluid_properties,
            "coldFluidProperties": cold_fluid_properties
        }
        
        if exchanger_type is not None:
            request_data["exchangerType"] = exchanger_type
        if flow_arrangement is not None:
            request_data["flowArrangement"] = flow_arrangement
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/equipment/heat-exchangers/sizing",
            data=request_data
        )
        
        return response_data
    
    def calculate_lmtd(
        self,
        hot_fluid_inlet: float,
        hot_fluid_outlet: float,
        cold_fluid_inlet: float,
        cold_fluid_outlet: float,
        flow_arrangement: str = "counterflow"
    ) -> float:
        """
        Calculate Log Mean Temperature Difference (LMTD).
        
        References:
        - TEMA Standard, Section 7
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
        
        Args:
            hot_fluid_inlet: Hot fluid inlet temperature in K
            hot_fluid_outlet: Hot fluid outlet temperature in K
            cold_fluid_inlet: Cold fluid inlet temperature in K
            cold_fluid_outlet: Cold fluid outlet temperature in K
            flow_arrangement: Flow arrangement ('counterflow', 'parallel')
            
        Returns:
            LMTD in K
        """
        if flow_arrangement == "counterflow":
            delta_t1 = hot_fluid_inlet - cold_fluid_outlet
            delta_t2 = hot_fluid_outlet - cold_fluid_inlet
        else:  # parallel flow
            delta_t1 = hot_fluid_inlet - cold_fluid_inlet
            delta_t2 = hot_fluid_outlet - cold_fluid_outlet
        
        if delta_t1 == delta_t2:
            return delta_t1
        
        lmtd = (delta_t1 - delta_t2) / (delta_t1 / delta_t2).log()
        return lmtd
    
    def calculate_overall_heat_transfer_coefficient(
        self,
        hot_htc: float,
        cold_htc: float,
        fouling_factor: float = 0.0002
    ) -> float:
        """
        Calculate overall heat transfer coefficient.
        
        References:
        - TEMA Standard, Section 8
        - Kern, D.Q.: Process Heat Transfer
        
        Args:
            hot_htc: Hot fluid heat transfer coefficient in W/m²·K
            cold_htc: Cold fluid heat transfer coefficient in W/m²·K
            fouling_factor: Fouling factor in m²·K/W
            
        Returns:
            Overall heat transfer coefficient in W/m²·K
        """
        # Overall heat transfer coefficient (TEMA Standard, Section 8)
        overall_u = 1 / (1/hot_htc + 1/cold_htc + fouling_factor)
        return overall_u
    
    def calculate_ntu(
        self,
        overall_u: float,
        area: float,
        min_capacity_rate: float
    ) -> float:
        """
        Calculate Number of Transfer Units (NTU).
        
        References:
        - TEMA Standard, Section 11
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
        
        Args:
            overall_u: Overall heat transfer coefficient in W/m²·K
            area: Heat transfer area in m²
            min_capacity_rate: Minimum capacity rate in W/K
            
        Returns:
            NTU
        """
        ntu = (overall_u * area) / min_capacity_rate
        return ntu
    
    def calculate_effectiveness(
        self,
        ntu: float,
        capacity_ratio: float,
        flow_arrangement: str = "counterflow"
    ) -> float:
        """
        Calculate heat exchanger effectiveness.
        
        References:
        - TEMA Standard, Section 12
        - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
        
        Args:
            ntu: Number of transfer units
            capacity_ratio: Capacity rate ratio (Cmin/Cmax)
            flow_arrangement: Flow arrangement ('counterflow', 'parallel', 'crossflow')
            
        Returns:
            Effectiveness (0-1)
        """
        if flow_arrangement == "counterflow":
            if capacity_ratio == 1:
                effectiveness = ntu / (1 + ntu)
            else:
                effectiveness = (1 - (capacity_ratio * (1 - ntu * (1 - capacity_ratio)).exp()) / 
                               (1 - capacity_ratio * (1 - ntu * (1 - capacity_ratio)).exp()))
        elif flow_arrangement == "parallel":
            effectiveness = (1 - (1 + capacity_ratio) * (1 - ntu * (1 + capacity_ratio)).exp()) / (1 + capacity_ratio)
        else:  # crossflow
            effectiveness = 1 - (1 - ntu * capacity_ratio).exp()
        
        return effectiveness
