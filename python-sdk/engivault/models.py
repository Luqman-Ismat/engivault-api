"""
EngiVault SDK Models

Pydantic models for request/response validation and type safety.
"""

from typing import Optional
from pydantic import BaseModel, Field, validator


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split('_')
    return components[0] + ''.join(x.capitalize() for x in components[1:])


class CamelCaseModel(BaseModel):
    """Base model that converts field names to camelCase for API requests."""
    
    model_config = {
        "alias_generator": to_camel_case,
        "populate_by_name": True,
    }


class PressureDropInput(CamelCaseModel):
    """Input parameters for pressure drop calculation."""
    flow_rate: float = Field(..., gt=0, description="Flow rate in m³/s")
    pipe_diameter: float = Field(..., gt=0, description="Pipe diameter in meters")
    pipe_length: float = Field(..., gt=0, description="Pipe length in meters")
    fluid_density: float = Field(..., gt=0, description="Fluid density in kg/m³")
    fluid_viscosity: float = Field(..., gt=0, description="Fluid viscosity in Pa·s")
    pipe_roughness: Optional[float] = Field(0.00015, gt=0, description="Pipe roughness in meters")


class PressureDropResult(CamelCaseModel):
    """Result of pressure drop calculation."""
    pressure_drop: float = Field(..., description="Pressure drop in Pa")
    reynolds_number: float = Field(..., description="Reynolds number (dimensionless)")
    friction_factor: float = Field(..., description="Friction factor (dimensionless)")
    velocity: float = Field(..., description="Fluid velocity in m/s")


class FlowRateInput(CamelCaseModel):
    """Input parameters for flow rate calculation."""
    pressure_drop: float = Field(..., gt=0, description="Pressure drop in Pa")
    pipe_diameter: float = Field(..., gt=0, description="Pipe diameter in meters")
    pipe_length: float = Field(..., gt=0, description="Pipe length in meters")
    fluid_density: float = Field(..., gt=0, description="Fluid density in kg/m³")
    fluid_viscosity: float = Field(..., gt=0, description="Fluid viscosity in Pa·s")
    pipe_roughness: Optional[float] = Field(0.00015, gt=0, description="Pipe roughness in meters")


class FlowRateResult(CamelCaseModel):
    """Result of flow rate calculation."""
    flow_rate: float = Field(..., description="Flow rate in m³/s")
    velocity: float = Field(..., description="Fluid velocity in m/s")
    reynolds_number: float = Field(..., description="Reynolds number (dimensionless)")


class PumpPerformanceInput(CamelCaseModel):
    """Input parameters for pump performance calculation."""
    flow_rate: float = Field(..., gt=0, description="Flow rate in m³/s")
    head: float = Field(..., gt=0, description="Pump head in meters")
    efficiency: float = Field(..., gt=0, le=1, description="Pump efficiency (0-1)")
    power: float = Field(..., gt=0, description="Pump power in watts")


class PumpPerformanceResult(CamelCaseModel):
    """Result of pump performance calculation."""
    hydraulic_power: float = Field(..., description="Hydraulic power in kW")
    brake_power: float = Field(..., description="Brake power in kW")
    specific_speed: float = Field(..., description="Specific speed (dimensionless)")
    efficiency: float = Field(..., description="Pump efficiency (0-1)")


class NPSHInput(CamelCaseModel):
    """Input parameters for NPSH calculation."""
    suction_pressure: float = Field(..., description="Suction pressure in Pa")
    vapor_pressure: float = Field(..., description="Vapor pressure in Pa")
    fluid_density: float = Field(..., gt=0, description="Fluid density in kg/m³")
    suction_velocity: float = Field(..., gt=0, description="Suction velocity in m/s")
    suction_losses: float = Field(..., gt=0, description="Suction losses in meters")


class NPSHResult(CamelCaseModel):
    """Result of NPSH calculation."""
    npsh_available: float = Field(..., description="NPSH available in meters")
    npsh_required: float = Field(..., description="NPSH required in meters")
    margin: float = Field(..., description="NPSH margin in meters")
    is_cavitation_risk: bool = Field(..., description="Whether there's cavitation risk")


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = Field(..., description="Whether the request was successful")
    data: Optional[dict] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if failed")
    timestamp: str = Field(..., description="Response timestamp")


class UsageStats(BaseModel):
    """User usage statistics."""
    total_requests: int = Field(..., description="Total API requests made")
    requests_today: int = Field(..., description="Requests made today")
    requests_this_month: int = Field(..., description="Requests made this month")
    average_response_time: float = Field(..., description="Average response time in ms")
    top_endpoints: list = Field(..., description="Most used endpoints")
    daily_usage: list = Field(..., description="Daily usage breakdown")


# Heat Transfer Models
class HeatExchangerInput(CamelCaseModel):
    """Input parameters for heat exchanger calculations."""
    heat_duty: float = Field(..., gt=0, description="Heat duty in W")
    overall_u: float = Field(..., gt=0, description="Overall heat transfer coefficient in W/m²·K")
    t_hot_in: float = Field(..., gt=0, description="Hot fluid inlet temperature in K")
    t_hot_out: float = Field(..., gt=0, description="Hot fluid outlet temperature in K")
    t_cold_in: float = Field(..., gt=0, description="Cold fluid inlet temperature in K")
    t_cold_out: float = Field(..., gt=0, description="Cold fluid outlet temperature in K")
    flow_arrangement: Optional[str] = Field("counterflow", description="Flow arrangement")


class HeatExchangerResult(CamelCaseModel):
    """Result of heat exchanger calculation."""
    area: float = Field(..., description="Heat transfer area in m²")
    lmtd: float = Field(..., description="Log mean temperature difference in K")
    effectiveness: float = Field(..., description="Heat exchanger effectiveness (0-1)")
    ntu: float = Field(..., description="Number of transfer units")
    capacity_ratio: float = Field(..., description="Capacity rate ratio")


class LMTDInput(CamelCaseModel):
    """Input parameters for LMTD calculation."""
    t_hot_in: float = Field(..., description="Hot fluid inlet temperature in K")
    t_hot_out: float = Field(..., description="Hot fluid outlet temperature in K")
    t_cold_in: float = Field(..., description="Cold fluid inlet temperature in K")
    t_cold_out: float = Field(..., description="Cold fluid outlet temperature in K")
    flow_arrangement: Optional[str] = Field("counterflow", description="Flow arrangement")


class LMTDResult(BaseModel):
    """Result of LMTD calculation."""
    lmtd: float = Field(..., description="Log mean temperature difference in K")


class EffectivenessNTUInput(CamelCaseModel):
    """Input parameters for effectiveness-NTU calculation."""
    ntu: float = Field(..., gt=0, description="Number of transfer units")
    capacity_ratio: float = Field(..., ge=0, le=1, description="Capacity rate ratio (Cmin/Cmax)")
    flow_arrangement: str = Field(..., description="Flow arrangement type")


class EffectivenessNTUResult(CamelCaseModel):
    """Result of effectiveness-NTU calculation."""
    effectiveness: float = Field(..., description="Heat exchanger effectiveness (0-1)")
    max_heat_transfer: float = Field(..., description="Maximum possible heat transfer factor")


# Fluid Mechanics Models
class OpenChannelFlowInput(CamelCaseModel):
    """Input parameters for open channel flow calculation."""
    flow_rate: float = Field(..., gt=0, description="Flow rate in m³/s")
    channel_width: float = Field(..., gt=0, description="Channel width in m")
    channel_slope: float = Field(..., gt=0, description="Channel slope (dimensionless)")
    mannings_s_coeff: float = Field(..., gt=0, description="Manning's roughness coefficient", alias="manningSCoeff")
    channel_shape: Optional[str] = Field("rectangular", description="Channel shape")
    side_slope: Optional[float] = Field(0, description="Side slope for trapezoidal (m:1)")


class OpenChannelFlowResult(CamelCaseModel):
    """Result of open channel flow calculation."""
    normal_depth: float = Field(..., description="Normal depth in m")
    critical_depth: float = Field(..., description="Critical depth in m")
    velocity: float = Field(..., description="Average velocity in m/s")
    froude_number: float = Field(..., description="Froude number")
    flow_regime: str = Field(..., description="Flow regime")
    hydraulic_radius: float = Field(..., description="Hydraulic radius in m")
    wetted_perimeter: float = Field(..., description="Wetted perimeter in m")
    top_width: float = Field(..., description="Top width in m")


class CompressibleFlowInput(CamelCaseModel):
    """Input parameters for compressible flow calculation."""
    mach_number: Optional[float] = Field(None, description="Mach number (if known)")
    velocity: Optional[float] = Field(None, description="Velocity in m/s (if Mach unknown)")
    temperature: float = Field(..., gt=0, description="Temperature in K")
    pressure: float = Field(..., gt=0, description="Pressure in Pa")
    gas_properties: dict = Field(..., description="Gas properties (gamma, gasConstant, molecularWeight)")
    flow_type: Optional[str] = Field("isentropic", description="Flow type")


class CompressibleFlowResult(CamelCaseModel):
    """Result of compressible flow calculation."""
    mach_number: float = Field(..., description="Mach number")
    velocity: float = Field(..., description="Velocity in m/s")
    speed_of_sound: float = Field(..., description="Speed of sound in m/s")
    stagnation_temperature: float = Field(..., description="Stagnation temperature in K")
    stagnation_pressure: float = Field(..., description="Stagnation pressure in Pa")
    density: float = Field(..., description="Density in kg/m³")
    flow_regime: str = Field(..., description="Flow regime")
    pressure_ratio: float = Field(..., description="p/p₀")
    temperature_ratio: float = Field(..., description="T/T₀")
    density_ratio: float = Field(..., description="ρ/ρ₀")


class BoundaryLayerInput(CamelCaseModel):
    """Input parameters for boundary layer calculation."""
    velocity: float = Field(..., gt=0, description="Free stream velocity in m/s")
    distance: float = Field(..., gt=0, description="Distance from leading edge in m")
    fluid_properties: dict = Field(..., description="Fluid properties (density, viscosity, kinematicViscosity)")
    surface_roughness: Optional[float] = Field(None, description="Surface roughness in m")
    plate_length: Optional[float] = Field(None, description="Total plate length in m")


class BoundaryLayerResult(CamelCaseModel):
    """Result of boundary layer calculation."""
    reynolds_number: float = Field(..., description="Reynolds number")
    boundary_layer_thickness: float = Field(..., description="Boundary layer thickness in m")
    displacement_thickness: float = Field(..., description="Displacement thickness in m")
    momentum_thickness: float = Field(..., description="Momentum thickness in m")
    skin_friction_coefficient: float = Field(..., description="Skin friction coefficient")
    wall_shear_stress: float = Field(..., description="Wall shear stress in Pa")
    flow_regime: str = Field(..., description="Flow regime")


class ExternalFlowInput(CamelCaseModel):
    """Input parameters for external flow calculation."""
    velocity: float = Field(..., gt=0, description="Free stream velocity in m/s")
    characteristic_length: float = Field(..., gt=0, description="Characteristic length in m")
    fluid_properties: dict = Field(..., description="Fluid properties (density, viscosity)")
    geometry: str = Field(..., description="Object geometry")
    angle_of_attack: Optional[float] = Field(None, description="Angle of attack in degrees")


class ExternalFlowResult(CamelCaseModel):
    """Result of external flow calculation."""
    reynolds_number: float = Field(..., description="Reynolds number")
    drag_coefficient: float = Field(..., description="Drag coefficient")
    lift_coefficient: Optional[float] = Field(None, description="Lift coefficient (if applicable)")
    drag_force: float = Field(..., description="Drag force in N")
    lift_force: Optional[float] = Field(None, description="Lift force in N (if applicable)")
    pressure_coefficient: float = Field(..., description="Pressure coefficient")
