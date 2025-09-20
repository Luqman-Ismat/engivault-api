"""
Tests for EngiVault Hydraulics Module
"""

import pytest
from unittest.mock import Mock, patch

from engivault import EngiVault
from engivault.exceptions import SDKValidationError


class TestHydraulicsModule:
    """Test hydraulics calculations."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = EngiVault(jwt_token="test-token")
    
    @patch('engivault.client.requests.Session.request')
    def test_pressure_drop_success(self, mock_request):
        """Test successful pressure drop calculation."""
        # Mock API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "data": {
                "pressureDrop": 762517.46,
                "reynoldsNumber": 1273239.54,
                "frictionFactor": 0.0094,
                "velocity": 12.73
            },
            "timestamp": "2025-09-16T17:19:34.027Z"
        }
        mock_request.return_value = mock_response
        
        # Test calculation
        result = self.client.hydraulics.pressure_drop(
            flow_rate=0.1,
            pipe_diameter=0.1,
            pipe_length=100,
            fluid_density=1000,
            fluid_viscosity=0.001
        )
        
        # Assertions
        assert result.pressure_drop == 762517.46
        assert result.reynolds_number == 1273239.54
        assert result.friction_factor == 0.0094
        assert result.velocity == 12.73
        
        # Verify API was called correctly
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        assert call_args[1]['method'] == 'POST'
        assert '/api/v1/hydraulics/pressure-drop' in call_args[1]['url']
    
    def test_pressure_drop_validation_error(self):
        """Test pressure drop with invalid inputs."""
        with pytest.raises(SDKValidationError):
            self.client.hydraulics.pressure_drop(
                flow_rate=-0.1,  # Invalid: negative flow rate
                pipe_diameter=0.1,
                pipe_length=100,
                fluid_density=1000,
                fluid_viscosity=0.001
            )
    
    @patch('engivault.client.requests.Session.request')
    def test_flow_rate_success(self, mock_request):
        """Test successful flow rate calculation."""
        # Mock API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "data": {
                "flowRate": 0.0356,
                "velocity": 4.54,
                "reynoldsNumber": 454000
            },
            "timestamp": "2025-09-16T17:19:34.027Z"
        }
        mock_request.return_value = mock_response
        
        # Test calculation
        result = self.client.hydraulics.flow_rate(
            pressure_drop=10000,
            pipe_diameter=0.1,
            pipe_length=100,
            fluid_density=1000,
            fluid_viscosity=0.001
        )
        
        # Assertions
        assert result.flow_rate == 0.0356
        assert result.velocity == 4.54
        assert result.reynolds_number == 454000
