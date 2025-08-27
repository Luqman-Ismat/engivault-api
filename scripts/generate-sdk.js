#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the server is running to get the OpenAPI schema
async function generateSDKs() {
  console.log('🚀 Generating SDKs...');
  
  try {
    // Start the server temporarily to get the OpenAPI schema
    console.log('📡 Starting server to extract OpenAPI schema...');
    
    // Get the OpenAPI schema from the running server
    const schemaUrl = 'http://localhost:3000/documentation/json';
    
    // Use curl to fetch the schema
    const schema = execSync(`curl -s ${schemaUrl}`, { encoding: 'utf8' });
    
    // Write the schema to a temporary file
    const schemaPath = path.join(__dirname, '../openapi-schema.json');
    fs.writeFileSync(schemaPath, schema);
    
    console.log('✅ OpenAPI schema extracted');
    
    // Generate TypeScript SDK
    console.log('🔧 Generating TypeScript SDK...');
    execSync(`npx openapi-typescript-codegen --input ${schemaPath} --output clients/ts --client fetch`, 
      { stdio: 'inherit' }
    );
    
    // Generate Python SDK manually
    console.log('🐍 Generating Python SDK...');
    generatePythonSDK(schema);
    
    // Clean up temporary schema file
    fs.unlinkSync(schemaPath);
    
    console.log('✅ SDKs generated successfully!');
    console.log('📁 TypeScript SDK: clients/ts/');
    console.log('📁 Python SDK: clients/py/');
    
  } catch (error) {
    console.error('❌ Error generating SDKs:', error.message);
    console.log('💡 Make sure the server is running on port 3000');
    process.exit(1);
  }
}

function generatePythonSDK(schemaJson) {
  const schema = JSON.parse(schemaJson);
  const pyDir = path.join(__dirname, '../clients/py');
  
  // Create directory structure
  if (!fs.existsSync(pyDir)) {
    fs.mkdirSync(pyDir, { recursive: true });
  }
  
  // Create __init__.py
  fs.writeFileSync(path.join(pyDir, '__init__.py'), `"""
EngiVault Python SDK
Generated from OpenAPI schema
"""

from .client import EngiVaultClient
from .models import *

__version__ = "1.0.0"
__all__ = ["EngiVaultClient"]
`);
  
  // Create client.py
  fs.writeFileSync(path.join(pyDir, 'client.py'), `"""
EngiVault API Client
"""

import requests
import json
from typing import Dict, Any, Optional, List
from .models import *

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
        return self._make_request("POST", "/api/v1/hydraulics/pressure-drop", data)
    
    def calculate_minor_losses(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate minor losses"""
        return self._make_request("POST", "/api/v1/hydraulics/minor-losses", data)
    
    def size_pipe(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Size pipe for target velocity or pressure drop"""
        return self._make_request("POST", "/api/v1/hydraulics/size-pipe", data)
    
    # Pumps endpoints
    def calculate_npsh(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate NPSH"""
        return self._make_request("POST", "/api/v1/pumps/npsh", data)
    
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
        return self._make_request("POST", "/api/v1/transients/calculate", data)
    
    # Gas endpoints
    def calculate_gas_flow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate gas flow"""
        return self._make_request("POST", "/api/v1/gas/flow", data)
    
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
        return self._make_request("POST", "/api/v1/slurries/flow", data)
    
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
`);
  
  // Create models.py
  fs.writeFileSync(path.join(pyDir, 'models.py'), `"""
Data models for EngiVault API
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class CurvePoint:
    q: float
    h: float

@dataclass
class PressureDropInput:
    Q: float
    L: float
    D: float
    roughness: float
    fluid: str
    units: Optional[str] = "SI"

@dataclass
class MinorLossesInput:
    Q: float
    D: float
    K: float
    fluid: str
    units: Optional[str] = "SI"

@dataclass
class PipeSizingInput:
    Q: float
    target: str  # 'velocity' or 'dP'
    value: float
    L: float
    roughness: float
    fluid: str
    units: Optional[str] = "SI"

@dataclass
class NPSHInput:
    P_atm: float
    P_vapor: float
    h_suction: float
    h_friction: float
    V_suction: float
    g: Optional[float] = 9.81

@dataclass
class ValveFlowInput:
    Cv: float
    dP: float
    SG: float
    units: Optional[str] = "SI"

@dataclass
class NetworkNode:
    id: str
    elevation: float
    demand: float

@dataclass
class NetworkPipe:
    from_node: str
    to_node: str
    length: float
    diameter: float
    roughness: float

@dataclass
class NetworkInput:
    nodes: List[NetworkNode]
    pipes: List[NetworkPipe]
    fluid: str

@dataclass
class TransientsInput:
    L: float
    D: float
    V0: float
    f: float
    valve_closure_time: float
    fluid: str

@dataclass
class GasFlowInput:
    P1: float
    P2: float
    L: float
    D: float
    T: float
    gas: str
    flow_type: str  # 'isothermal' or 'adiabatic'

@dataclass
class SlurryFlowInput:
    Q: float
    L: float
    D: float
    Cv: float
    d50: float
    SG_solid: float
    SG_fluid: float
    fluid: str

@dataclass
class FillDrainInput:
    tank_volume: float
    Q: float
    operation: str  # 'fill' or 'drain'

@dataclass
class CurveFitInput:
    points: List[CurvePoint]
    model: str  # 'quadratic' or 'cubic'

@dataclass
class UnitConversionInput:
    value: float
    from_unit: str
    to_unit: str
    quantity: str
`);
  
  // Create setup.py
  fs.writeFileSync(path.join(pyDir, 'setup.py'), `from setuptools import setup, find_packages

setup(
    name="engivault-py-sdk",
    version="1.0.0",
    description="Python SDK for EngiVault API",
    author="EngiVault Team",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0",
    ],
    python_requires=">=3.7",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
`);
  
  // Create README.md
  fs.writeFileSync(path.join(pyDir, 'README.md'), `# EngiVault Python SDK

A Python client library for the EngiVault API.

## Installation

\`\`\`bash
pip install -e .
\`\`\`

## Usage

\`\`\`python
from engivault_py_sdk import EngiVaultClient

# Create client
client = EngiVaultClient(base_url="http://localhost:3000")

# Calculate pressure drop
result = client.calculate_pressure_drop({
    "Q": 0.1,
    "L": 100,
    "D": 0.1,
    "roughness": 0.000045,
    "fluid": "water"
})

print(result)
\`\`\`

## Available Methods

- \`calculate_pressure_drop()\` - Calculate pressure drop
- \`calculate_minor_losses()\` - Calculate minor losses
- \`size_pipe()\` - Size pipe for target velocity or pressure drop
- \`calculate_npsh()\` - Calculate NPSH
- \`check_bep()\` - Check Best Efficiency Point
- \`calculate_valve_flow()\` - Calculate valve flow
- \`solve_network()\` - Solve network using Hardy Cross method
- \`calculate_transients()\` - Calculate transients
- \`calculate_gas_flow()\` - Calculate gas flow
- \`calculate_fanno_line()\` - Calculate Fanno line
- \`calculate_rayleigh_line()\` - Calculate Rayleigh line
- \`calculate_viscosity_adjusted_drop()\` - Calculate viscosity adjusted pressure drop
- \`calculate_hx_pressure_drop()\` - Calculate heat exchanger pressure drop
- \`calculate_slurry_flow()\` - Calculate slurry flow
- \`calculate_fill_drain_time()\` - Calculate fill/drain time
- \`fit_pump_curve()\` - Fit pump curve
- \`convert_units()\` - Convert units
- \`get_health()\` - Get health status
`);
}

generateSDKs();
