"""
EngiVault Heat Transfer Module

Heat transfer calculations including heat exchangers, convection, conduction, and thermal analysis.
"""

from typing import TYPE_CHECKING, Optional

from ..models import (
    HeatExchangerInput,
    HeatExchangerResult,
    LMTDInput,
    LMTDResult,
    EffectivenessNTUInput,
    EffectivenessNTUResult,
)
from ..exceptions import SDKValidationError

if TYPE_CHECKING:
    from ..client import EngiVaultClient


class HeatTransferModule:
    """Heat transfer calculations module."""
    
    def __init__(self, client: "EngiVaultClient"):
        self.client = client
    
    def heat_exchanger_area(
        self,
        heat_duty: float,
        overall_u: float,
        t_hot_in: float,
        t_hot_out: float,
        t_cold_in: float,
        t_cold_out: float,
        flow_arrangement: Optional[str] = None,
    ) -> HeatExchangerResult:
        """
        Calculate heat exchanger area using LMTD method.
        
        Args:
            heat_duty: Heat duty in W
            overall_u: Overall heat transfer coefficient in W/m²·K
            t_hot_in: Hot fluid inlet temperature in K
            t_hot_out: Hot fluid outlet temperature in K
            t_cold_in: Cold fluid inlet temperature in K
            t_cold_out: Cold fluid outlet temperature in K
            flow_arrangement: Flow arrangement ('counterflow', 'parallel', 'crossflow')
            
        Returns:
            HeatExchangerResult with area, LMTD, effectiveness, NTU, and capacity ratio
            
        Example:
            >>> result = client.heat_transfer.heat_exchanger_area(
            ...     heat_duty=50000,
            ...     overall_u=500,
            ...     t_hot_in=353,  # 80°C
            ...     t_hot_out=333, # 60°C
            ...     t_cold_in=293, # 20°C
            ...     t_cold_out=313 # 40°C
            ... )
            >>> print(f"Required area: {result.area:.2f} m²")
        """
        # Validate inputs
        try:
            input_data = HeatExchangerInput(
                heat_duty=heat_duty,
                overall_u=overall_u,
                t_hot_in=t_hot_in,
                t_hot_out=t_hot_out,
                t_cold_in=t_cold_in,
                t_cold_out=t_cold_out,
                flow_arrangement=flow_arrangement or "counterflow",
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/heat-transfer/heat-exchanger-area",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return HeatExchangerResult(**response_data)
    
    def lmtd(
        self,
        t_hot_in: float,
        t_hot_out: float,
        t_cold_in: float,
        t_cold_out: float,
        flow_arrangement: Optional[str] = None,
    ) -> float:
        """
        Calculate Log Mean Temperature Difference (LMTD).
        
        Args:
            t_hot_in: Hot fluid inlet temperature in K
            t_hot_out: Hot fluid outlet temperature in K
            t_cold_in: Cold fluid inlet temperature in K
            t_cold_out: Cold fluid outlet temperature in K
            flow_arrangement: Flow arrangement ('counterflow', 'parallel')
            
        Returns:
            LMTD in K
            
        Example:
            >>> lmtd = client.heat_transfer.lmtd(
            ...     t_hot_in=353,  # 80°C
            ...     t_hot_out=333, # 60°C
            ...     t_cold_in=293, # 20°C
            ...     t_cold_out=313 # 40°C
            ... )
            >>> print(f"LMTD: {lmtd:.2f} K")
        """
        # Validate inputs
        try:
            input_data = LMTDInput(
                t_hot_in=t_hot_in,
                t_hot_out=t_hot_out,
                t_cold_in=t_cold_in,
                t_cold_out=t_cold_out,
                flow_arrangement=flow_arrangement or "counterflow",
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/heat-transfer/lmtd",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        result = LMTDResult(**response_data)
        return result.lmtd
    
    def effectiveness_ntu(
        self,
        ntu: float,
        capacity_ratio: float,
        flow_arrangement: str,
    ) -> EffectivenessNTUResult:
        """
        Calculate heat exchanger effectiveness using NTU method.
        
        Args:
            ntu: Number of transfer units
            capacity_ratio: Capacity rate ratio (Cmin/Cmax, 0-1)
            flow_arrangement: Flow arrangement ('counterflow', 'parallel', 'crossflow_unmixed')
            
        Returns:
            EffectivenessNTUResult with effectiveness and maximum heat transfer factor
            
        Example:
            >>> result = client.heat_transfer.effectiveness_ntu(
            ...     ntu=2.5,
            ...     capacity_ratio=0.6,
            ...     flow_arrangement="counterflow"
            ... )
            >>> print(f"Effectiveness: {result.effectiveness:.1%}")
        """
        # Validate inputs
        try:
            input_data = EffectivenessNTUInput(
                ntu=ntu,
                capacity_ratio=capacity_ratio,
                flow_arrangement=flow_arrangement,
            )
        except Exception as e:
            raise SDKValidationError(f"Invalid input parameters: {str(e)}")
        
        # Make API request
        response_data = self.client._make_request(
            method="POST",
            endpoint="/api/v1/heat-transfer/effectiveness-ntu",
            data=input_data.dict(by_alias=True),
        )
        
        # Parse and return result
        return EffectivenessNTUResult(**response_data)
    
    def heat_exchanger_sizing(
        self,
        heat_duty: float,
        hot_fluid_inlet: float,
        hot_fluid_outlet: float,
        cold_fluid_inlet: float,
        cold_fluid_outlet: float,
        overall_u: float,
        flow_arrangement: str = "counterflow"
    ) -> dict:
        """
        Complete heat exchanger sizing analysis.
        
        Args:
            heat_duty: Heat duty in W
            hot_fluid_inlet: Hot fluid inlet temperature in K
            hot_fluid_outlet: Hot fluid outlet temperature in K
            cold_fluid_inlet: Cold fluid inlet temperature in K
            cold_fluid_outlet: Cold fluid outlet temperature in K
            overall_u: Overall heat transfer coefficient in W/m²·K
            flow_arrangement: Flow arrangement type
            
        Returns:
            Complete sizing analysis with area, effectiveness, and performance metrics
            
        Example:
            >>> sizing = client.heat_transfer.heat_exchanger_sizing(
            ...     heat_duty=100000,
            ...     hot_fluid_inlet=353,
            ...     hot_fluid_outlet=333,
            ...     cold_fluid_inlet=293,
            ...     cold_fluid_outlet=313,
            ...     overall_u=500
            ... )
            >>> print(f"Required area: {sizing['area']:.2f} m²")
            >>> print(f"Effectiveness: {sizing['effectiveness']:.1%}")
        """
        # Get heat exchanger analysis
        hx_result = self.heat_exchanger_area(
            heat_duty=heat_duty,
            overall_u=overall_u,
            t_hot_in=hot_fluid_inlet,
            t_hot_out=hot_fluid_outlet,
            t_cold_in=cold_fluid_inlet,
            t_cold_out=cold_fluid_outlet,
            flow_arrangement=flow_arrangement
        )
        
        # Get LMTD
        lmtd_value = self.lmtd(
            t_hot_in=hot_fluid_inlet,
            t_hot_out=hot_fluid_outlet,
            t_cold_in=cold_fluid_inlet,
            t_cold_out=cold_fluid_outlet,
            flow_arrangement=flow_arrangement
        )
        
        # Calculate additional metrics
        hot_capacity_rate = heat_duty / (hot_fluid_inlet - hot_fluid_outlet)
        cold_capacity_rate = heat_duty / (cold_fluid_outlet - cold_fluid_inlet)
        
        return {
            "area": hx_result.area,
            "lmtd": lmtd_value,
            "effectiveness": hx_result.effectiveness,
            "ntu": hx_result.ntu,
            "capacity_ratio": hx_result.capacity_ratio,
            "hot_capacity_rate": hot_capacity_rate,
            "cold_capacity_rate": cold_capacity_rate,
            "heat_duty": heat_duty,
            "overall_u": overall_u,
            "flow_arrangement": flow_arrangement
        }
