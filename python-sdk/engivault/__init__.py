"""
EngiVault Python SDK

A simple, powerful Python SDK for the EngiVault Engineering Calculations API.

Example (Simple API):
    >>> import engivault as ev
    >>> 
    >>> # Initialize once
    >>> ev.init("your-api-key")
    >>> 
    >>> # Direct function calls
    >>> result = ev.pressure_drop(
    ...     flow_rate=0.1,
    ...     pipe_diameter=0.1,
    ...     pipe_length=100,
    ...     fluid_density=1000,
    ...     fluid_viscosity=0.001
    ... )
    >>> print(f"Pressure drop: {result['pressure_drop']:.2f} Pa")

Example (Traditional API):
    >>> import engivault
    >>> 
    >>> # Create client
    >>> client = engivault.EngiVault("your-api-key")
    >>> 
    >>> # Use client methods
    >>> result = client.hydraulics.pressure_drop(...)
"""

from .client import EngiVaultClient, create_client

# Import convenience functions for simplified API
from .shortcuts import (
    init,
    get_client,
    pressure_drop,
    flow_rate,
    pump_power,
    npsh,
    lmtd,
    heat_exchanger,
    open_channel_flow,
)
from .exceptions import (
    EngiVaultError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    APIError,
    NetworkError,
    ConfigurationError,
)
from .models import (
    PressureDropInput,
    PressureDropResult,
    FlowRateInput,
    FlowRateResult,
    PumpPerformanceInput,
    PumpPerformanceResult,
    NPSHInput,
    NPSHResult,
    UsageStats,
    HeatExchangerInput,
    HeatExchangerResult,
    LMTDInput,
    LMTDResult,
    EffectivenessNTUInput,
    EffectivenessNTUResult,
)

# Main client class alias for convenience
EngiVault = EngiVaultClient

# Version info
__version__ = "1.0.0"
__author__ = "Luqman Ismat"
__email__ = "luqman@engivault.com"

# Convenience exports
__all__ = [
    # Main client
    "EngiVault",
    "EngiVaultClient", 
    "create_client",
    
    # Simplified API
    "init",
    "get_client",
    "pressure_drop",
    "flow_rate",
    "pump_power",
    "npsh",
    "lmtd",
    "heat_exchanger",
    "open_channel_flow",
    
    # Exceptions
    "EngiVaultError",
    "AuthenticationError",
    "ValidationError", 
    "RateLimitError",
    "APIError",
    "NetworkError",
    "ConfigurationError",
    
    # Models
    "PressureDropInput",
    "PressureDropResult",
    "FlowRateInput", 
    "FlowRateResult",
    "PumpPerformanceInput",
    "PumpPerformanceResult",
    "NPSHInput",
    "NPSHResult",
    "UsageStats",
    
    # Heat Transfer Models
    "HeatExchangerInput",
    "HeatExchangerResult",
    "LMTDInput",
    "LMTDResult",
    "EffectivenessNTUInput",
    "EffectivenessNTUResult",
]
