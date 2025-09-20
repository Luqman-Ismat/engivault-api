"""
EngiVault Analytics Module

Usage analytics and statistics.
"""

from typing import TYPE_CHECKING, Optional

from ..models import UsageStats
from ..exceptions import SDKValidationError

if TYPE_CHECKING:
    from ..client import EngiVaultClient


class AnalyticsModule:
    """Analytics and usage statistics module."""
    
    def __init__(self, client: "EngiVaultClient"):
        self.client = client
    
    def usage_stats(self, days: Optional[int] = None) -> UsageStats:
        """
        Get usage statistics for the authenticated user.
        
        Args:
            days: Number of days to include in statistics (default: 30)
            
        Returns:
            UsageStats with request counts, response times, and usage patterns
            
        Example:
            >>> stats = client.analytics.usage_stats(days=7)
            >>> print(f"Total requests: {stats.total_requests}")
            >>> print(f"Requests today: {stats.requests_today}")
        """
        params = {}
        if days is not None:
            if days < 1 or days > 365:
                raise SDKValidationError("Days must be between 1 and 365")
            params["days"] = days
        
        # Make API request
        response_data = self.client._make_request(
            method="GET",
            endpoint="/analytics/usage",
            params=params,
        )
        
        # Parse and return result
        return UsageStats(**response_data)
    
    def api_key_performance(self) -> list:
        """
        Get performance statistics for all API keys.
        
        Returns:
            List of API key performance data
            
        Example:
            >>> performance = client.analytics.api_key_performance()
            >>> for key_data in performance:
            ...     print(f"Key: {key_data['keyName']}, Usage: {key_data['usageCountTotal']}")
        """
        return self.client._make_request(
            method="GET",
            endpoint="/analytics/api-keys",
        )
    
    def subscription_limits(self) -> dict:
        """
        Get current subscription limits and usage.
        
        Returns:
            Dictionary with subscription tier, limits, and current usage
            
        Example:
            >>> limits = client.analytics.subscription_limits()
            >>> remaining = limits['remainingRequestsThisMonth']
            >>> print(f"Requests remaining this month: {remaining}")
        """
        return self.client._make_request(
            method="GET",
            endpoint="/analytics/limits",
        )
