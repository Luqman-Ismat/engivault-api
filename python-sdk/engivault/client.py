"""
EngiVault SDK Client

Main client class for interacting with the EngiVault API.
"""

import json
import time
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests
from pydantic import ValidationError

from .exceptions import (
    APIError,
    AuthenticationError,
    ConfigurationError,
    NetworkError,
    RateLimitError,
    ValidationError as SDKValidationError,
)
from .models import APIResponse


class EngiVaultClient:
    """
    Main client for the EngiVault Engineering Calculations API.
    
    Args:
        api_key: Your EngiVault API key
        base_url: Base URL for the API (default: production)
        timeout: Request timeout in seconds (default: 30)
        
    Example:
        >>> client = EngiVaultClient("your-api-key")
        >>> result = client.hydraulics.pressure_drop(
        ...     flow_rate=0.1,
        ...     pipe_diameter=0.1,
        ...     pipe_length=100,
        ...     fluid_density=1000,
        ...     fluid_viscosity=0.001
        ... )
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        jwt_token: Optional[str] = None,
        base_url: str = "https://engivault-api-production.up.railway.app",
        timeout: int = 30,
    ):
        if not api_key and not jwt_token:
            raise ConfigurationError("Either api_key or jwt_token must be provided")
            
        self.api_key = api_key
        self.jwt_token = jwt_token
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        
        # Initialize session
        self.session = requests.Session()
        self._setup_auth()
        
        # Initialize modules
        from .hydraulics import HydraulicsModule
        from .pumps import PumpsModule
        from .analytics import AnalyticsModule
        from .heat_transfer import HeatTransferModule
        from .fluid_mechanics import FluidMechanicsModule
        
        self.hydraulics = HydraulicsModule(self)
        self.pumps = PumpsModule(self)
        self.analytics = AnalyticsModule(self)
        self.heat_transfer = HeatTransferModule(self)
        self.fluid_mechanics = FluidMechanicsModule(self)
    
    def _setup_auth(self) -> None:
        """Set up authentication headers."""
        if self.jwt_token:
            self.session.headers.update({
                "Authorization": f"Bearer {self.jwt_token}"
            })
        elif self.api_key:
            self.session.headers.update({
                "X-API-Key": self.api_key
            })
        
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "EngiVault-Python-SDK/1.0.0"
        })
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make an HTTP request to the API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters
            
        Returns:
            Parsed JSON response
            
        Raises:
            NetworkError: If request fails
            AuthenticationError: If authentication fails
            RateLimitError: If rate limit exceeded
            APIError: If API returns an error
        """
        url = urljoin(self.base_url, endpoint)
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                timeout=self.timeout,
            )
        except requests.exceptions.RequestException as e:
            raise NetworkError(f"Network request failed: {str(e)}")
        
        # Handle HTTP status codes
        if response.status_code == 401:
            raise AuthenticationError("Invalid API key or JWT token")
        elif response.status_code == 429:
            raise RateLimitError("Rate limit exceeded")
        elif response.status_code >= 400:
            try:
                error_data = response.json()
                error_message = error_data.get("error", f"HTTP {response.status_code}")
            except json.JSONDecodeError:
                error_message = f"HTTP {response.status_code}: {response.text}"
            raise APIError(error_message, response.status_code)
        
        # Parse response
        try:
            response_data = response.json()
        except json.JSONDecodeError:
            raise APIError("Invalid JSON response from API")
        
        # Validate response format
        try:
            api_response = APIResponse(**response_data)
        except ValidationError as e:
            raise APIError(f"Invalid response format: {str(e)}")
        
        # Check for API-level errors
        if not api_response.success:
            raise APIError(api_response.error or "Unknown API error")
        
        return api_response.data or {}
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check API health status.
        
        Returns:
            Health status information
        """
        return self._make_request("GET", "/health")
    
    def get_info(self) -> Dict[str, Any]:
        """
        Get API information.
        
        Returns:
            API status and version information
        """
        return self._make_request("GET", "/")


# Convenience function for quick client creation
def create_client(api_key: Optional[str] = None, jwt_token: Optional[str] = None) -> EngiVaultClient:
    """
    Create an EngiVault client instance.
    
    Args:
        api_key: Your EngiVault API key
        jwt_token: Your JWT token (alternative to API key)
        
    Returns:
        Configured EngiVault client
        
    Example:
        >>> import engivault
        >>> client = engivault.create_client("your-api-key")
    """
    return EngiVaultClient(api_key=api_key, jwt_token=jwt_token)
