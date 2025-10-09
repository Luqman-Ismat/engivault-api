"""
Tests for simplified API shortcuts
"""

import pytest
import engivault as ev
from engivault.exceptions import EngiVaultError


class TestSimplifiedAPI:
    """Test the simplified convenience API"""
    
    def test_init_with_api_key(self):
        """Test initialization with API key"""
        client = ev.init('test-api-key')
        assert client is not None
        assert isinstance(client, ev.EngiVaultClient)
    
    def test_init_without_api_key(self, monkeypatch):
        """Test initialization from environment variable"""
        monkeypatch.setenv('ENGIVAULT_API_KEY', 'env-api-key')
        client = ev.init()
        assert client is not None
    
    def test_get_client_before_init(self):
        """Test that get_client raises error if not initialized"""
        # Reset global client
        ev.shortcuts._global_client = None
        
        with pytest.raises(RuntimeError, match="not initialized"):
            ev.get_client()
    
    def test_get_client_after_init(self):
        """Test get_client returns the initialized client"""
        client = ev.init('test-key')
        retrieved = ev.get_client()
        assert retrieved is client
    
    def test_pressure_drop_shortcut(self, mocker):
        """Test pressure_drop shortcut function"""
        # Initialize client
        ev.init('test-key')
        
        # Mock the API call
        mock_response = {
            'pressure_drop': 100000,
            'velocity': 1.27,
            'reynolds_number': 127324,
            'friction_factor': 0.0185
        }
        
        mocker.patch.object(
            ev.get_client().hydraulics,
            'pressure_drop',
            return_value=mock_response
        )
        
        result = ev.pressure_drop(
            flow_rate=0.01,
            pipe_diameter=0.1,
            pipe_length=100,
            fluid_density=1000,
            fluid_viscosity=0.001
        )
        
        assert result['pressure_drop'] == 100000
        assert result['velocity'] == 1.27
    
    def test_pump_power_shortcut(self, mocker):
        """Test pump_power shortcut function"""
        ev.init('test-key')
        
        mock_response = {
            'hydraulic_power': 24525,
            'shaft_power': 30656,
            'motor_power': 34062
        }
        
        mocker.patch.object(
            ev.get_client().pumps,
            'pump_performance',
            return_value=mock_response
        )
        
        result = ev.pump_power(
            flow_rate=0.05,
            head=50,
            efficiency=0.8
        )
        
        assert result['shaft_power'] == 30656
    
    def test_lmtd_shortcut(self, mocker):
        """Test LMTD shortcut function"""
        ev.init('test-key')
        
        mock_response = {
            'lmtd': 43.97,
            'delta_t1': 80,
            'delta_t2': 20
        }
        
        mocker.patch.object(
            ev.get_client().heat_transfer,
            'lmtd',
            return_value=mock_response
        )
        
        result = ev.lmtd(
            t_hot_in=373,
            t_hot_out=323,
            t_cold_in=293,
            t_cold_out=333
        )
        
        assert result['lmtd'] == 43.97
    
    def test_open_channel_flow_shortcut(self, mocker):
        """Test open_channel_flow shortcut function"""
        ev.init('test-key')
        
        mock_response = {
            'normal_depth': 1.234,
            'velocity': 1.62,
            'froude_number': 0.467,
            'flow_regime': 'subcritical'
        }
        
        mocker.patch.object(
            ev.get_client().fluid_mechanics,
            'open_channel_flow',
            return_value=mock_response
        )
        
        result = ev.open_channel_flow(
            flow_rate=10.0,
            channel_width=5.0,
            channel_slope=0.001,
            mannings_coeff=0.03
        )
        
        assert result['normal_depth'] == 1.234
        assert result['flow_regime'] == 'subcritical'


class TestErrorHandling:
    """Test error handling in simplified API"""
    
    def test_function_without_init(self):
        """Test that functions raise error if client not initialized"""
        ev.shortcuts._global_client = None
        
        with pytest.raises(RuntimeError, match="not initialized"):
            ev.pressure_drop(
                flow_rate=0.01,
                pipe_diameter=0.1,
                pipe_length=100,
                fluid_density=1000,
                fluid_viscosity=0.001
            )
    
    def test_api_error_propagation(self, mocker):
        """Test that API errors are properly propagated"""
        ev.init('test-key')
        
        mocker.patch.object(
            ev.get_client().hydraulics,
            'pressure_drop',
            side_effect=EngiVaultError("API Error", status_code=400)
        )
        
        with pytest.raises(EngiVaultError, match="API Error"):
            ev.pressure_drop(
                flow_rate=0.01,
                pipe_diameter=0.1,
                pipe_length=100,
                fluid_density=1000,
                fluid_viscosity=0.001
            )

