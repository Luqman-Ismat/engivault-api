"""
EngiVault Python SDK

A simple, powerful Python SDK for the EngiVault Engineering Calculations API.

Example:
    >>> import engivault
    >>> 
    >>> # Create client
    >>> client = engivault.EngiVault("your-api-key")
    >>> 
    >>> # Calculate pressure drop
    >>> result = client.hydraulics.pressure_drop(
    ...     flow_rate=0.1,
    ...     pipe_diameter=0.1,
    ...     pipe_length=100,
    ...     fluid_density=1000,
    ...     fluid_viscosity=0.001
    ... )
    >>> 
    >>> print(f"Pressure drop: {result.pressure_drop:.2f} Pa")
"""

from .client import EngiVaultClient, create_client
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
