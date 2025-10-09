"""
EngiVault SDK Convenience Functions

Provides direct function access without needing to instantiate a client.
Uses a global client instance that's automatically configured.

Example:
    >>> import engivault as ev
    >>> ev.init("your-api-key")
    >>> result = ev.pressure_drop(diameter=0.1, length=100, ...)
"""

from typing import Optional, Dict, Any
from .client import EngiVaultClient

# Global client instance
_global_client: Optional[EngiVaultClient] = None


def init(api_key: Optional[str] = None, **config) -> EngiVaultClient:
    """
    Initialize the global EngiVault client.
    
    Args:
        api_key: API key for authentication. If not provided, reads from ENGIVAULT_API_KEY env var.
        **config: Additional configuration options (base_url, timeout, etc.)
    
    Returns:
        The initialized global client instance.
    
    Example:
        >>> import engivault as ev
        >>> client = ev.init("your-api-key")
        >>> # Or with config
        >>> client = ev.init("key", timeout=60)
    """
    global _global_client
    _global_client = EngiVaultClient(api_key=api_key, **config)
    return _global_client


def get_client() -> EngiVaultClient:
    """
    Get the global client instance.
    
    Returns:
        The global client instance.
    
    Raises:
        RuntimeError: If the client hasn't been initialized.
    
    Example:
        >>> import engivault as ev
        >>> ev.init("your-api-key")
        >>> client = ev.get_client()
    """
    if _global_client is None:
        raise RuntimeError(
            "EngiVault client not initialized. "
            "Call engivault.init('your-api-key') first."
        )
    return _global_client


# ============================================================================
# Hydraulics Functions
# ============================================================================

def pressure_drop(
    flow_rate: float,
    pipe_diameter: float,
    pipe_length: float,
    fluid_density: float,
    fluid_viscosity: float,
    pipe_roughness: float = 4.6e-5,
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate pressure drop in a pipe.
    
    Args:
        flow_rate: Volumetric flow rate (m³/s)
        pipe_diameter: Internal pipe diameter (m)
        pipe_length: Pipe length (m)
        fluid_density: Fluid density (kg/m³)
        fluid_viscosity: Dynamic viscosity (Pa·s)
        pipe_roughness: Absolute roughness (m), default is commercial steel
        **kwargs: Additional parameters
    
    Returns:
        Dict containing pressure_drop, velocity, reynolds_number, friction_factor
    
    Example:
        >>> import engivault as ev
        >>> ev.init("your-api-key")
        >>> result = ev.pressure_drop(
        ...     flow_rate=0.01,
        ...     pipe_diameter=0.1,
        ...     pipe_length=100,
        ...     fluid_density=1000,
        ...     fluid_viscosity=0.001
        ... )
        >>> print(f"Pressure drop: {result['pressure_drop']} Pa")
    """
    client = get_client()
    return client.hydraulics.pressure_drop(
        flow_rate=flow_rate,
        pipe_diameter=pipe_diameter,
        pipe_length=pipe_length,
        fluid_density=fluid_density,
        fluid_viscosity=fluid_viscosity,
        pipe_roughness=pipe_roughness,
        **kwargs
    )


def flow_rate(
    pressure_drop: float,
    pipe_diameter: float,
    pipe_length: float,
    fluid_density: float,
    fluid_viscosity: float,
    pipe_roughness: float = 4.6e-5,
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate flow rate from pressure drop.
    
    Args:
        pressure_drop: Pressure drop (Pa)
        pipe_diameter: Internal pipe diameter (m)
        pipe_length: Pipe length (m)
        fluid_density: Fluid density (kg/m³)
        fluid_viscosity: Dynamic viscosity (Pa·s)
        pipe_roughness: Absolute roughness (m)
        **kwargs: Additional parameters
    
    Returns:
        Dict containing flow_rate, velocity, reynolds_number, friction_factor
    
    Example:
        >>> result = ev.flow_rate(
        ...     pressure_drop=10000,
        ...     pipe_diameter=0.1,
        ...     pipe_length=100,
        ...     fluid_density=1000,
        ...     fluid_viscosity=0.001
        ... )
    """
    client = get_client()
    return client.hydraulics.flow_rate(
        pressure_drop=pressure_drop,
        pipe_diameter=pipe_diameter,
        pipe_length=pipe_length,
        fluid_density=fluid_density,
        fluid_viscosity=fluid_viscosity,
        pipe_roughness=pipe_roughness,
        **kwargs
    )


# ============================================================================
# Pump Functions
# ============================================================================

def pump_power(
    flow_rate: float,
    head: float,
    efficiency: float,
    fluid_density: float = 1000.0,
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate pump power requirements.
    
    Args:
        flow_rate: Volumetric flow rate (m³/s)
        head: Total head (m)
        efficiency: Pump efficiency (0-1)
        fluid_density: Fluid density (kg/m³), default is water
        **kwargs: Additional parameters
    
    Returns:
        Dict containing hydraulic_power, shaft_power, motor_power
    
    Example:
        >>> result = ev.pump_power(
        ...     flow_rate=0.05,
        ...     head=50,
        ...     efficiency=0.8,
        ...     fluid_density=1000
        ... )
    """
    client = get_client()
    return client.pumps.pump_performance(
        flow_rate=flow_rate,
        head=head,
        efficiency=efficiency,
        fluid_density=fluid_density,
        **kwargs
    )


def npsh(
    suction_pressure: float,
    vapor_pressure: float,
    fluid_density: float,
    elevation_head: float,
    velocity_head: float = 0.0,
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate Net Positive Suction Head Available (NPSHA).
    
    Args:
        suction_pressure: Suction pressure (Pa)
        vapor_pressure: Vapor pressure at operating temp (Pa)
        fluid_density: Fluid density (kg/m³)
        elevation_head: Elevation from fluid surface to pump centerline (m)
        velocity_head: Velocity head in suction line (m)
        **kwargs: Additional parameters
    
    Returns:
        Dict containing npsha, npsh_margin
    
    Example:
        >>> result = ev.npsh(
        ...     suction_pressure=101325,
        ...     vapor_pressure=2337,
        ...     fluid_density=1000,
        ...     elevation_head=2.0,
        ...     velocity_head=1.5
        ... )
    """
    client = get_client()
    return client.pumps.npsh(
        suction_pressure=suction_pressure,
        vapor_pressure=vapor_pressure,
        fluid_density=fluid_density,
        elevation_head=elevation_head,
        velocity_head=velocity_head,
        **kwargs
    )


# ============================================================================
# Heat Transfer Functions
# ============================================================================

def lmtd(
    t_hot_in: float,
    t_hot_out: float,
    t_cold_in: float,
    t_cold_out: float,
    flow_arrangement: str = 'counterflow',
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate Log Mean Temperature Difference.
    
    Args:
        t_hot_in: Hot fluid inlet temperature (K or °C)
        t_hot_out: Hot fluid outlet temperature (K or °C)
        t_cold_in: Cold fluid inlet temperature (K or °C)
        t_cold_out: Cold fluid outlet temperature (K or °C)
        flow_arrangement: 'counterflow' or 'parallel'
        **kwargs: Additional parameters
    
    Returns:
        Dict containing lmtd, delta_t1, delta_t2
    
    Example:
        >>> result = ev.lmtd(
        ...     t_hot_in=373,
        ...     t_hot_out=323,
        ...     t_cold_in=293,
        ...     t_cold_out=333,
        ...     flow_arrangement='counterflow'
        ... )
    """
    client = get_client()
    return client.heat_transfer.lmtd(
        t_hot_in=t_hot_in,
        t_hot_out=t_hot_out,
        t_cold_in=t_cold_in,
        t_cold_out=t_cold_out,
        flow_arrangement=flow_arrangement,
        **kwargs
    )


def heat_exchanger(
    heat_duty: float,
    overall_u: float,
    t_hot_in: float,
    t_hot_out: float,
    t_cold_in: float,
    t_cold_out: float,
    flow_arrangement: str = 'counterflow',
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate required heat exchanger area.
    
    Args:
        heat_duty: Heat transfer rate (W)
        overall_u: Overall heat transfer coefficient (W/m²·K)
        t_hot_in: Hot fluid inlet temperature (K)
        t_hot_out: Hot fluid outlet temperature (K)
        t_cold_in: Cold fluid inlet temperature (K)
        t_cold_out: Cold fluid outlet temperature (K)
        flow_arrangement: 'counterflow' or 'parallel'
        **kwargs: Additional parameters
    
    Returns:
        Dict containing area, lmtd, effectiveness, ntu
    
    Example:
        >>> result = ev.heat_exchanger(
        ...     heat_duty=100000,
        ...     overall_u=500,
        ...     t_hot_in=373,
        ...     t_hot_out=323,
        ...     t_cold_in=293,
        ...     t_cold_out=333
        ... )
    """
    client = get_client()
    return client.heat_transfer.heat_exchanger_area(
        heat_duty=heat_duty,
        overall_u=overall_u,
        t_hot_in=t_hot_in,
        t_hot_out=t_hot_out,
        t_cold_in=t_cold_in,
        t_cold_out=t_cold_out,
        flow_arrangement=flow_arrangement,
        **kwargs
    )


# ============================================================================
# Fluid Mechanics Functions
# ============================================================================

def open_channel_flow(
    flow_rate: float,
    channel_width: float,
    channel_slope: float,
    mannings_coeff: float,
    channel_shape: str = 'rectangular',
    **kwargs
) -> Dict[str, Any]:
    """
    Calculate open channel flow properties.
    
    Args:
        flow_rate: Volumetric flow rate (m³/s)
        channel_width: Channel width (m)
        channel_slope: Channel bed slope (dimensionless)
        mannings_coeff: Manning's roughness coefficient
        channel_shape: 'rectangular', 'trapezoidal', etc.
        **kwargs: Additional parameters
    
    Returns:
        Dict containing normal_depth, velocity, froude_number, flow_regime
    
    Example:
        >>> result = ev.open_channel_flow(
        ...     flow_rate=10.0,
        ...     channel_width=5.0,
        ...     channel_slope=0.001,
        ...     mannings_coeff=0.03
        ... )
    """
    client = get_client()
    return client.fluid_mechanics.open_channel_flow(
        flow_rate=flow_rate,
        channel_width=channel_width,
        channel_slope=channel_slope,
        mannings_coeff=mannings_coeff,
        channel_shape=channel_shape,
        **kwargs
    )


# ============================================================================
# Exported convenience functions
# ============================================================================

__all__ = [
    # Initialization
    'init',
    'get_client',
    
    # Hydraulics
    'pressure_drop',
    'flow_rate',
    
    # Pumps
    'pump_power',
    'npsh',
    
    # Heat Transfer
    'lmtd',
    'heat_exchanger',
    
    # Fluid Mechanics
    'open_channel_flow',
]

