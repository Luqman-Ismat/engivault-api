"""
EngiVault API Client
"""

import requests
import json
from typing import Dict, Any, Optional, List
from models import *

class EngiVaultClient:
    """Client for EngiVault API"""
    
    def __init__(self, base_url: str = "http://localhost:3000", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})
        self.session.headers.update({"Content-Type": "application/json"})
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, json=data)
        response.raise_for_status()
        return response.json()
    
    # Hydraulics endpoints
    def calculate_pressure_drop(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate pressure drop"""
        return self._make_request("POST", "/api/v1/calculate/pressure-drop", data)
    
    def calculate_minor_losses(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate minor losses"""
        return self._make_request("POST", "/api/v1/calculate/minor-losses", data)
    
    def size_pipe(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Size pipe for target velocity or pressure drop"""
        return self._make_request("POST", "/api/v1/hydraulics/size-pipe", data)
    
    # Pumps endpoints
    def calculate_npsh(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate NPSH"""
        return self._make_request("POST", "/api/v1/npsh", data)
    
    def check_bep(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Check Best Efficiency Point"""
        return self._make_request("POST", "/api/v1/pumps/bep-check", data)
    
    # Valves endpoints
    def calculate_valve_flow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate valve flow"""
        return self._make_request("POST", "/api/v1/valves/flow", data)
    
    # Networks endpoints
    def solve_network(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Solve network using Hardy Cross method"""
        return self._make_request("POST", "/api/v1/networks/solve", data)
    
    # Transients endpoints
    def calculate_transients(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate transients"""
        return self._make_request("POST", "/api/v1/transients/joukowsky", data)
    
    # Gas endpoints
    def calculate_gas_flow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate gas flow"""
        return self._make_request("POST", "/api/v1/gas/pressure-drop", data)
    
    def calculate_fanno_line(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Fanno line"""
        return self._make_request("POST", "/api/v1/gas/fanno", data)
    
    def calculate_rayleigh_line(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Rayleigh line"""
        return self._make_request("POST", "/api/v1/gas/rayleigh", data)
    
    # Thermal endpoints
    def calculate_viscosity_adjusted_drop(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate viscosity adjusted pressure drop"""
        return self._make_request("POST", "/api/v1/thermal/viscosity-adjusted-drop", data)
    
    def calculate_hx_pressure_drop(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate heat exchanger pressure drop"""
        return self._make_request("POST", "/api/v1/thermal/hx-drop", data)
    
    # Slurries endpoints
    def calculate_slurry_flow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate slurry flow"""
        return self._make_request("POST", "/api/v1/slurries/pressure-drop", data)
    
    # Operations endpoints
    def calculate_fill_drain_time(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate fill/drain time"""
        return self._make_request("POST", "/api/v1/operations/fill-drain-time", data)
    
    # Curves endpoints
    def fit_pump_curve(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Fit pump curve"""
        return self._make_request("POST", "/api/v1/curves/fit", data)
    
    # Utilities endpoints
    def convert_units(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert units"""
        return self._make_request("POST", "/api/v1/utilities/convert", data)
    
    def get_health(self) -> Dict[str, Any]:
        """Get health status"""
        return self._make_request("GET", "/health")
