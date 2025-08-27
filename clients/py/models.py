"""
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
