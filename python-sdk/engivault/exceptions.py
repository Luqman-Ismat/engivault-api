"""
EngiVault SDK Exceptions

Custom exception classes for the EngiVault Python SDK.
"""

from typing import Any, Dict, Optional


class EngiVaultError(Exception):
    """Base exception class for EngiVault SDK."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_data = response_data


class AuthenticationError(EngiVaultError):
    """Raised when authentication fails."""
    pass


class ValidationError(EngiVaultError):
    """Raised when input validation fails."""
    pass


class SDKValidationError(ValidationError):
    """Alias for ValidationError to avoid conflicts."""
    pass


class RateLimitError(EngiVaultError):
    """Raised when rate limit is exceeded."""
    pass


class APIError(EngiVaultError):
    """Raised when the API returns an error."""
    pass


class NetworkError(EngiVaultError):
    """Raised when network request fails."""
    pass


class ConfigurationError(EngiVaultError):
    """Raised when SDK configuration is invalid."""
    pass
