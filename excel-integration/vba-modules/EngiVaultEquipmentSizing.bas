Attribute VB_Name = "EngiVaultEquipmentSizing"
'===============================================================================
' EngiVault Excel Integration - Equipment Sizing Module
' VBA Module for Equipment Sizing Calculations
'
' Version: 1.0.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' PUMP SIZING FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_PUMP_SIZING( _
    flowRate As Double, _
    head As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double, _
    npshAvailable As Double, _
    Optional efficiencyTarget As Double = 0.8, _
    Optional pumpType As String = "centrifugal", _
    Optional operatingHours As Double = 8760, _
    Optional designTemperature As Double = 288, _
    Optional designPressure As Double = 101325 _
) As Double
    '
    ' Calculate pump sizing based on hydraulic requirements
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   head: Pump head in meters
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '   npshAvailable: NPSH available in meters
    '   efficiencyTarget: Target efficiency (0-1)
    '   pumpType: Pump type ("centrifugal", "positive_displacement", "specialty")
    '   operatingHours: Operating hours per year
    '   designTemperature: Design temperature in K
    '   designPressure: Design pressure in Pa
    '
    ' Returns: Hydraulic power in kW
    '
    ' Example: =ENGIVAULT_PUMP_SIZING(0.1, 50, 1000, 0.001, 5.0)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim hydraulicPower As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """head"": " & head & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """fluidViscosity"": " & fluidViscosity & ", " & _
        """npshAvailable"": " & npshAvailable & ", " & _
        """efficiencyTarget"": " & efficiencyTarget & ", " & _
        """pumpType"": """ & pumpType & """, " & _
        """operatingHours"": " & operatingHours & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """designPressure"": " & designPressure & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/pumps/sizing", requestBody)
    
    ' Parse response and extract hydraulic power
    hydraulicPower = ParseNumericResponse(response, "hydraulicPower")
    
    ENGIVAULT_PUMP_SIZING = hydraulicPower
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_SIZING = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PUMP_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_PUMP_BRAKE_POWER( _
    flowRate As Double, _
    head As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double, _
    npshAvailable As Double, _
    Optional efficiencyTarget As Double = 0.8 _
) As Double
    '
    ' Calculate pump brake power
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   head: Pump head in meters
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '   npshAvailable: NPSH available in meters
    '   efficiencyTarget: Target efficiency (0-1)
    '
    ' Returns: Brake power in kW
    '
    ' Example: =ENGIVAULT_PUMP_BRAKE_POWER(0.1, 50, 1000, 0.001, 5.0)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim brakePower As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """head"": " & head & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """fluidViscosity"": " & fluidViscosity & ", " & _
        """npshAvailable"": " & npshAvailable & ", " & _
        """efficiencyTarget"": " & efficiencyTarget & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/pumps/sizing", requestBody)
    
    ' Parse response and extract brake power
    brakePower = ParseNumericResponse(response, "brakePower")
    
    ENGIVAULT_PUMP_BRAKE_POWER = brakePower
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_BRAKE_POWER = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PUMP_BRAKE_POWER: " & Err.Description
End Function

Public Function ENGIVAULT_PUMP_SPECIFIC_SPEED( _
    flowRate As Double, _
    head As Double, _
    Optional rotationalSpeed As Double = 1450 _
) As Double
    '
    ' Calculate pump specific speed
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   head: Pump head in meters
    '   rotationalSpeed: Rotational speed in RPM
    '
    ' Returns: Specific speed
    '
    ' Example: =ENGIVAULT_PUMP_SPECIFIC_SPEED(0.1, 50, 1450)
    '
    
    On Error GoTo ErrorHandler
    
    Dim specificSpeed As Double
    
    ' Specific speed calculation (API 610, Section 6.1.2)
    specificSpeed = (flowRate ^ 0.5 * (head * 9.81) ^ 0.75) / (head * 9.81) ^ 0.75
    
    ENGIVAULT_PUMP_SPECIFIC_SPEED = specificSpeed
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_SPECIFIC_SPEED = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PUMP_SPECIFIC_SPEED: " & Err.Description
End Function

'===============================================================================
' HEAT EXCHANGER SIZING FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_HEAT_EXCHANGER_SIZING( _
    heatDuty As Double, _
    hotFluidInlet As Double, _
    hotFluidOutlet As Double, _
    coldFluidInlet As Double, _
    coldFluidOutlet As Double, _
    hotFlowRate As Double, _
    coldFlowRate As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    hotFluidDensity As Double, _
    hotFluidViscosity As Double, _
    hotFluidThermalConductivity As Double, _
    hotFluidSpecificHeat As Double, _
    coldFluidDensity As Double, _
    coldFluidViscosity As Double, _
    coldFluidThermalConductivity As Double, _
    coldFluidSpecificHeat As Double, _
    Optional exchangerType As String = "shell_tube", _
    Optional flowArrangement As String = "counterflow" _
) As Double
    '
    ' Calculate heat exchanger sizing using TEMA standards
    '
    ' Parameters:
    '   heatDuty: Heat duty in W
    '   hotFluidInlet: Hot fluid inlet temperature in K
    '   hotFluidOutlet: Hot fluid outlet temperature in K
    '   coldFluidInlet: Cold fluid inlet temperature in K
    '   coldFluidOutlet: Cold fluid outlet temperature in K
    '   hotFlowRate: Hot fluid flow rate in kg/s
    '   coldFlowRate: Cold fluid flow rate in kg/s
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   hotFluidDensity: Hot fluid density in kg/m³
    '   hotFluidViscosity: Hot fluid viscosity in Pa·s
    '   hotFluidThermalConductivity: Hot fluid thermal conductivity in W/m·K
    '   hotFluidSpecificHeat: Hot fluid specific heat in J/kg·K
    '   coldFluidDensity: Cold fluid density in kg/m³
    '   coldFluidViscosity: Cold fluid viscosity in Pa·s
    '   coldFluidThermalConductivity: Cold fluid thermal conductivity in W/m·K
    '   coldFluidSpecificHeat: Cold fluid specific heat in J/kg·K
    '   exchangerType: Heat exchanger type ("shell_tube", "plate", "air_cooled", "compact")
    '   flowArrangement: Flow arrangement ("counterflow", "parallel", "crossflow")
    '
    ' Returns: Heat transfer area in m²
    '
    ' Example: =ENGIVAULT_HEAT_EXCHANGER_SIZING(50000, 353, 333, 293, 313, 10, 15, 1000000, 423, 1000, 0.001, 0.6, 4180, 1000, 0.001, 0.6, 4180)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim area As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """heatDuty"": " & heatDuty & ", " & _
        """hotFluidInlet"": " & hotFluidInlet & ", " & _
        """hotFluidOutlet"": " & hotFluidOutlet & ", " & _
        """coldFluidInlet"": " & coldFluidInlet & ", " & _
        """coldFluidOutlet"": " & coldFluidOutlet & ", " & _
        """hotFlowRate"": " & hotFlowRate & ", " & _
        """coldFlowRate"": " & coldFlowRate & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """hotFluidProperties"": {" & _
            """density"": " & hotFluidDensity & ", " & _
            """viscosity"": " & hotFluidViscosity & ", " & _
            """thermalConductivity"": " & hotFluidThermalConductivity & ", " & _
            """specificHeat"": " & hotFluidSpecificHeat & _
        "}, " & _
        """coldFluidProperties"": {" & _
            """density"": " & coldFluidDensity & ", " & _
            """viscosity"": " & coldFluidViscosity & ", " & _
            """thermalConductivity"": " & coldFluidThermalConductivity & ", " & _
            """specificHeat"": " & coldFluidSpecificHeat & _
        "}, " & _
        """exchangerType"": """ & exchangerType & """, " & _
        """flowArrangement"": """ & flowArrangement & """" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/heat-exchangers/sizing", requestBody)
    
    ' Parse response and extract area
    area = ParseNumericResponse(response, "area")
    
    ENGIVAULT_HEAT_EXCHANGER_SIZING = area
    Exit Function
    
ErrorHandler:
    ENGIVAULT_HEAT_EXCHANGER_SIZING = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_HEAT_EXCHANGER_SIZING: " & Err.Description
End Function

'===============================================================================
' VESSEL SIZING FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_VESSEL_SIZING( _
    volume As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    vesselType As String, _
    Optional material As String = "carbon_steel", _
    Optional diameter As Double = 0, _
    Optional length As Double = 0, _
    Optional height As Double = 0, _
    Optional operatingPressure As Double = 0, _
    Optional operatingTemperature As Double = 0, _
    Optional fluidDensity As Double = 1000 _
) As Double
    '
    ' Calculate vessel sizing using ASME Section VIII standards
    '
    ' Parameters:
    '   volume: Vessel volume in m³
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   vesselType: Vessel type ("storage_tank", "pressure_vessel", "separator", "reactor")
    '   material: Vessel material ("carbon_steel", "stainless_steel", "aluminum")
    '   diameter: Vessel diameter in m (optional)
    '   length: Vessel length in m (optional)
    '   height: Vessel height in m (optional)
    '   operatingPressure: Operating pressure in Pa (optional)
    '   operatingTemperature: Operating temperature in K (optional)
    '   fluidDensity: Fluid density in kg/m³ (optional)
    '
    ' Returns: Vessel diameter in m
    '
    ' Example: =ENGIVAULT_VESSEL_SIZING(100, 1000000, 423, "pressure_vessel")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim vesselDiameter As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """volume"": " & volume & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """vesselType"": """ & vesselType & """, " & _
        """material"": """ & material & """, " & _
        """diameter"": " & diameter & ", " & _
        """length"": " & length & ", " & _
        """height"": " & height & ", " & _
        """operatingConditions"": {" & _
            """pressure"": " & operatingPressure & ", " & _
            """temperature"": " & operatingTemperature & ", " & _
            """fluidDensity"": " & fluidDensity & _
        "}" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/vessels/sizing", requestBody)
    
    ' Parse response and extract diameter
    vesselDiameter = ParseNumericResponse(response, "diameter")
    
    ENGIVAULT_VESSEL_SIZING = vesselDiameter
    Exit Function
    
ErrorHandler:
    ENGIVAULT_VESSEL_SIZING = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_VESSEL_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_VESSEL_WALL_THICKNESS( _
    volume As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    vesselType As String, _
    Optional material As String = "carbon_steel" _
) As Double
    '
    ' Calculate vessel wall thickness using ASME Section VIII
    '
    ' Parameters:
    '   volume: Vessel volume in m³
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   vesselType: Vessel type ("storage_tank", "pressure_vessel", "separator", "reactor")
    '   material: Vessel material ("carbon_steel", "stainless_steel", "aluminum")
    '
    ' Returns: Wall thickness in m
    '
    ' Example: =ENGIVAULT_VESSEL_WALL_THICKNESS(100, 1000000, 423, "pressure_vessel")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim wallThickness As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """volume"": " & volume & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """vesselType"": """ & vesselType & """, " & _
        """material"": """ & material & """" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/vessels/sizing", requestBody)
    
    ' Parse response and extract wall thickness
    wallThickness = ParseNumericResponse(response, "wallThickness")
    
    ENGIVAULT_VESSEL_WALL_THICKNESS = wallThickness
    Exit Function
    
ErrorHandler:
    ENGIVAULT_VESSEL_WALL_THICKNESS = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_VESSEL_WALL_THICKNESS: " & Err.Description
End Function

'===============================================================================
' PIPING SIZING FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_PIPING_SIZING( _
    flowRate As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double, _
    Optional pressureDrop As Double = 0, _
    Optional velocityLimit As Double = 3.0, _
    Optional pipeMaterial As String = "carbon_steel", _
    Optional pipeSchedule As String = "Schedule 40", _
    Optional designPressure As Double = 0, _
    Optional designTemperature As Double = 0, _
    Optional pipeLength As Double = 100 _
) As Double
    '
    ' Calculate piping sizing using ASME B31.3 standards
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '   pressureDrop: Allowable pressure drop in Pa (optional)
    '   velocityLimit: Maximum velocity in m/s (optional)
    '   pipeMaterial: Pipe material (optional)
    '   pipeSchedule: Pipe schedule (optional)
    '   designPressure: Design pressure in Pa (optional)
    '   designTemperature: Design temperature in K (optional)
    '   pipeLength: Pipe length in m (optional)
    '
    ' Returns: Pipe diameter in m
    '
    ' Example: =ENGIVAULT_PIPING_SIZING(0.1, 1000, 0.001, 10000, 3.0)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim pipeDiameter As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """fluidViscosity"": " & fluidViscosity & ", " & _
        """pressureDrop"": " & pressureDrop & ", " & _
        """velocityLimit"": " & velocityLimit & ", " & _
        """pipeMaterial"": """ & pipeMaterial & """, " & _
        """pipeSchedule"": """ & pipeSchedule & """, " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """pipeLength"": " & pipeLength & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/piping/sizing", requestBody)
    
    ' Parse response and extract pipe diameter
    pipeDiameter = ParseNumericResponse(response, "pipeDiameter")
    
    ENGIVAULT_PIPING_SIZING = pipeDiameter
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PIPING_SIZING = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PIPING_SIZING: " & Err.Description
End Function

'===============================================================================
' UTILITY FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_EQUIPMENT_COST_ESTIMATE( _
    equipmentType As String, _
    size As Double, _
    material As String, _
    Optional pressure As Double = 1, _
    Optional temperature As Double = 288 _
) As Double
    '
    ' Estimate equipment cost based on size and material
    '
    ' Parameters:
    '   equipmentType: Equipment type ("pump", "heat_exchanger", "vessel", "piping")
    '   size: Equipment size (area, volume, diameter, etc.)
    '   material: Material type ("carbon_steel", "stainless_steel", "aluminum")
    '   pressure: Design pressure in bar (optional)
    '   temperature: Design temperature in K (optional)
    '
    ' Returns: Estimated cost in USD
    '
    ' Example: =ENGIVAULT_EQUIPMENT_COST_ESTIMATE("pump", 50, "stainless_steel", 10, 423)
    '
    
    On Error GoTo ErrorHandler
    
    Dim baseCost As Double
    Dim materialFactor As Double
    Dim pressureFactor As Double
    Dim temperatureFactor As Double
    Dim totalCost As Double
    
    ' Base cost per unit (USD)
    Select Case LCase(equipmentType)
        Case "pump"
            baseCost = 1000 ' USD per kW
        Case "heat_exchanger"
            baseCost = 1500 ' USD per m²
        Case "vessel"
            baseCost = 2000 ' USD per m³
        Case "piping"
            baseCost = 100 ' USD per m
        Case Else
            baseCost = 1000
    End Select
    
    ' Material factors
    Select Case LCase(material)
        Case "carbon_steel"
            materialFactor = 1.0
        Case "stainless_steel"
            materialFactor = 2.5
        Case "aluminum"
            materialFactor = 1.5
        Case "titanium"
            materialFactor = 8.0
        Case Else
            materialFactor = 1.0
    End Select
    
    ' Pressure factor
    If pressure <= 1 Then
        pressureFactor = 1.0
    ElseIf pressure <= 10 Then
        pressureFactor = 1.0 + 0.1 * (pressure - 1)
    Else
        pressureFactor = 2.0 + 0.05 * (pressure - 10)
    End If
    
    ' Temperature factor
    If temperature <= 288 Then
        temperatureFactor = 1.0
    ElseIf temperature <= 423 Then
        temperatureFactor = 1.0 + 0.05 * (temperature - 288) / 135
    Else
        temperatureFactor = 1.5 + 0.1 * (temperature - 423) / 100
    End If
    
    ' Calculate total cost
    totalCost = baseCost * size * materialFactor * pressureFactor * temperatureFactor
    
    ENGIVAULT_EQUIPMENT_COST_ESTIMATE = totalCost
    Exit Function
    
ErrorHandler:
    ENGIVAULT_EQUIPMENT_COST_ESTIMATE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_EQUIPMENT_COST_ESTIMATE: " & Err.Description
End Function

'===============================================================================
' INFORMATION FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_EQUIPMENT_STANDARDS(equipmentType As String) As String
    '
    ' Get applicable standards for equipment type
    '
    ' Parameters:
    '   equipmentType: Equipment type ("pump", "heat_exchanger", "vessel", "piping")
    '
    ' Returns: Applicable standards
    '
    ' Example: =ENGIVAULT_EQUIPMENT_STANDARDS("pump")
    '
    
    On Error GoTo ErrorHandler
    
    Dim standards As String
    
    Select Case LCase(equipmentType)
        Case "pump"
            standards = "API 610, HI 14.6, ISO 13709"
        Case "heat_exchanger"
            standards = "TEMA, ASME Section VIII, ISO 13709"
        Case "vessel"
            standards = "ASME Section VIII, API 650, API 620"
        Case "piping"
            standards = "ASME B31.3, API 570, ISO 14661"
        Case Else
            standards = "General engineering standards"
    End Select
    
    ENGIVAULT_EQUIPMENT_STANDARDS = standards
    Exit Function
    
ErrorHandler:
    ENGIVAULT_EQUIPMENT_STANDARDS = "Error"
    Debug.Print "Error in ENGIVAULT_EQUIPMENT_STANDARDS: " & Err.Description
End Function

'===============================================================================
' PUMP SELECTION AND PERFORMANCE ANALYSIS FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_PUMP_SELECTION( _
    sizingResults As String, _
    Optional constraints As String = "", _
    Optional preferences As String = "" _
) As String
    '
    ' Select pump from catalog based on sizing results
    '
    ' Parameters:
    '   sizingResults: JSON string with pump sizing results
    '   constraints: JSON string with selection constraints (optional)
    '   preferences: JSON string with user preferences (optional)
    '
    ' Returns: JSON string with selected pumps and recommendations
    '
    ' Example: =ENGIVAULT_PUMP_SELECTION("{"flowRate":0.1,"head":50,"brakePower":5}")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """sizingResults"": " & sizingResults
    If constraints <> "" Then
        requestBody = requestBody & ", ""constraints"": " & constraints
    End If
    If preferences <> "" Then
        requestBody = requestBody & ", ""preferences"": " & preferences
    End If
    requestBody = requestBody & "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/pumps/selection", requestBody)
    
    ENGIVAULT_PUMP_SELECTION = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_SELECTION = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_PUMP_SELECTION: " & Err.Description
End Function

Public Function ENGIVAULT_PUMP_PERFORMANCE_ANALYSIS( _
    pumpData As String, _
    systemData As String _
) As String
    '
    ' Analyze pump performance curves and system curves
    '
    ' Parameters:
    '   pumpData: JSON string with pump performance data
    '   systemData: JSON string with system curve data
    '
    ' Returns: JSON string with performance analysis results
    '
    ' Example: =ENGIVAULT_PUMP_PERFORMANCE_ANALYSIS("{"flowRate":0.1,"head":50}", "{"systemHead":45}")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """pumpData"": " & pumpData & ", " & _
        """systemData"": " & systemData & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/pumps/performance-analysis", requestBody)
    
    ENGIVAULT_PUMP_PERFORMANCE_ANALYSIS = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_PERFORMANCE_ANALYSIS = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_PUMP_PERFORMANCE_ANALYSIS: " & Err.Description
End Function

Public Function ENGIVAULT_SYSTEM_CURVE( _
    staticHead As Double, _
    frictionLosses As Double, _
    flowRate As Double _
) As String
    '
    ' Calculate system curve for pump selection
    '
    ' Parameters:
    '   staticHead: Static head in meters
    '   frictionLosses: Friction losses in meters
    '   flowRate: Flow rate in m³/s
    '
    ' Returns: JSON string with system curve data
    '
    ' Example: =ENGIVAULT_SYSTEM_CURVE(20, 10, 0.1)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """staticHead"": " & staticHead & ", " & _
        """frictionLosses"": " & frictionLosses & ", " & _
        """flowRate"": " & flowRate & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/pumps/system-curve", requestBody)
    
    ENGIVAULT_SYSTEM_CURVE = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_SYSTEM_CURVE = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_SYSTEM_CURVE: " & Err.Description
End Function

'===============================================================================
' ADVANCED HEAT EXCHANGER SIZING FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_SHELL_TUBE_OPTIMIZATION( _
    heatDuty As Double, _
    hotFluidInlet As Double, _
    hotFluidOutlet As Double, _
    coldFluidInlet As Double, _
    coldFluidOutlet As Double, _
    hotFlowRate As Double, _
    coldFlowRate As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    hotFluidDensity As Double, _
    hotFluidViscosity As Double, _
    hotFluidThermalConductivity As Double, _
    hotFluidSpecificHeat As Double, _
    coldFluidDensity As Double, _
    coldFluidViscosity As Double, _
    coldFluidThermalConductivity As Double, _
    coldFluidSpecificHeat As Double _
) As String
    '
    ' Optimize shell and tube heat exchanger design using TEMA standards
    '
    ' Parameters:
    '   heatDuty: Heat duty in W
    '   hotFluidInlet: Hot fluid inlet temperature in K
    '   hotFluidOutlet: Hot fluid outlet temperature in K
    '   coldFluidInlet: Cold fluid inlet temperature in K
    '   coldFluidOutlet: Cold fluid outlet temperature in K
    '   hotFlowRate: Hot fluid flow rate in kg/s
    '   coldFlowRate: Cold fluid flow rate in kg/s
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   hotFluidDensity: Hot fluid density in kg/m³
    '   hotFluidViscosity: Hot fluid viscosity in Pa·s
    '   hotFluidThermalConductivity: Hot fluid thermal conductivity in W/m·K
    '   hotFluidSpecificHeat: Hot fluid specific heat in J/kg·K
    '   coldFluidDensity: Cold fluid density in kg/m³
    '   coldFluidViscosity: Cold fluid viscosity in Pa·s
    '   coldFluidThermalConductivity: Cold fluid thermal conductivity in W/m·K
    '   coldFluidSpecificHeat: Cold fluid specific heat in J/kg·K
    '
    ' Returns: JSON string with optimized design results
    '
    ' Example: =ENGIVAULT_SHELL_TUBE_OPTIMIZATION(50000, 353, 333, 293, 313, 10, 15, 1000000, 423, 1000, 0.001, 0.6, 4180, 1000, 0.001, 0.6, 4180)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """heatDuty"": " & heatDuty & ", " & _
        """hotFluidInlet"": " & hotFluidInlet & ", " & _
        """hotFluidOutlet"": " & hotFluidOutlet & ", " & _
        """coldFluidInlet"": " & coldFluidInlet & ", " & _
        """coldFluidOutlet"": " & coldFluidOutlet & ", " & _
        """hotFlowRate"": " & hotFlowRate & ", " & _
        """coldFlowRate"": " & coldFlowRate & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """hotFluidProperties"": {" & _
            """density"": " & hotFluidDensity & ", " & _
            """viscosity"": " & hotFluidViscosity & ", " & _
            """thermalConductivity"": " & hotFluidThermalConductivity & ", " & _
            """specificHeat"": " & hotFluidSpecificHeat & _
        "}, " & _
        """coldFluidProperties"": {" & _
            """density"": " & coldFluidDensity & ", " & _
            """viscosity"": " & coldFluidViscosity & ", " & _
            """thermalConductivity"": " & coldFluidThermalConductivity & ", " & _
            """specificHeat"": " & coldFluidSpecificHeat & _
        "}" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/heat-exchangers/shell-tube-optimization", requestBody)
    
    ENGIVAULT_SHELL_TUBE_OPTIMIZATION = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_SHELL_TUBE_OPTIMIZATION = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_SHELL_TUBE_OPTIMIZATION: " & Err.Description
End Function

Public Function ENGIVAULT_PLATE_HEAT_EXCHANGER_SIZING( _
    heatDuty As Double, _
    hotFluidInlet As Double, _
    hotFluidOutlet As Double, _
    coldFluidInlet As Double, _
    coldFluidOutlet As Double, _
    hotFlowRate As Double, _
    coldFlowRate As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    hotFluidDensity As Double, _
    hotFluidViscosity As Double, _
    hotFluidThermalConductivity As Double, _
    hotFluidSpecificHeat As Double, _
    coldFluidDensity As Double, _
    coldFluidViscosity As Double, _
    coldFluidThermalConductivity As Double, _
    coldFluidSpecificHeat As Double _
) As String
    '
    ' Calculate plate heat exchanger sizing
    '
    ' Parameters:
    '   heatDuty: Heat duty in W
    '   hotFluidInlet: Hot fluid inlet temperature in K
    '   hotFluidOutlet: Hot fluid outlet temperature in K
    '   coldFluidInlet: Cold fluid inlet temperature in K
    '   coldFluidOutlet: Cold fluid outlet temperature in K
    '   hotFlowRate: Hot fluid flow rate in kg/s
    '   coldFlowRate: Cold fluid flow rate in kg/s
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   hotFluidDensity: Hot fluid density in kg/m³
    '   hotFluidViscosity: Hot fluid viscosity in Pa·s
    '   hotFluidThermalConductivity: Hot fluid thermal conductivity in W/m·K
    '   hotFluidSpecificHeat: Hot fluid specific heat in J/kg·K
    '   coldFluidDensity: Cold fluid density in kg/m³
    '   coldFluidViscosity: Cold fluid viscosity in Pa·s
    '   coldFluidThermalConductivity: Cold fluid thermal conductivity in W/m·K
    '   coldFluidSpecificHeat: Cold fluid specific heat in J/kg·K
    '
    ' Returns: JSON string with plate heat exchanger sizing results
    '
    ' Example: =ENGIVAULT_PLATE_HEAT_EXCHANGER_SIZING(50000, 353, 333, 293, 313, 10, 15, 1000000, 423, 1000, 0.001, 0.6, 4180, 1000, 0.001, 0.6, 4180)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """heatDuty"": " & heatDuty & ", " & _
        """hotFluidInlet"": " & hotFluidInlet & ", " & _
        """hotFluidOutlet"": " & hotFluidOutlet & ", " & _
        """coldFluidInlet"": " & coldFluidInlet & ", " & _
        """coldFluidOutlet"": " & coldFluidOutlet & ", " & _
        """hotFlowRate"": " & hotFlowRate & ", " & _
        """coldFlowRate"": " & coldFlowRate & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """hotFluidProperties"": {" & _
            """density"": " & hotFluidDensity & ", " & _
            """viscosity"": " & hotFluidViscosity & ", " & _
            """thermalConductivity"": " & hotFluidThermalConductivity & ", " & _
            """specificHeat"": " & hotFluidSpecificHeat & _
        "}, " & _
        """coldFluidProperties"": {" & _
            """density"": " & coldFluidDensity & ", " & _
            """viscosity"": " & coldFluidViscosity & ", " & _
            """thermalConductivity"": " & coldFluidThermalConductivity & ", " & _
            """specificHeat"": " & coldFluidSpecificHeat & _
        "}" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/heat-exchangers/plate-sizing", requestBody)
    
    ENGIVAULT_PLATE_HEAT_EXCHANGER_SIZING = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PLATE_HEAT_EXCHANGER_SIZING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_PLATE_HEAT_EXCHANGER_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_AIR_COOLED_HEAT_EXCHANGER_SIZING( _
    heatDuty As Double, _
    hotFluidInlet As Double, _
    hotFluidOutlet As Double, _
    coldFluidInlet As Double, _
    coldFluidOutlet As Double, _
    hotFlowRate As Double, _
    coldFlowRate As Double, _
    designPressure As Double, _
    designTemperature As Double, _
    hotFluidDensity As Double, _
    hotFluidViscosity As Double, _
    hotFluidThermalConductivity As Double, _
    hotFluidSpecificHeat As Double, _
    coldFluidDensity As Double, _
    coldFluidViscosity As Double, _
    coldFluidThermalConductivity As Double, _
    coldFluidSpecificHeat As Double _
) As String
    '
    ' Calculate air-cooled heat exchanger sizing using API 661 standards
    '
    ' Parameters:
    '   heatDuty: Heat duty in W
    '   hotFluidInlet: Hot fluid inlet temperature in K
    '   hotFluidOutlet: Hot fluid outlet temperature in K
    '   coldFluidInlet: Cold fluid inlet temperature in K
    '   coldFluidOutlet: Cold fluid outlet temperature in K
    '   hotFlowRate: Hot fluid flow rate in kg/s
    '   coldFlowRate: Cold fluid flow rate in kg/s
    '   designPressure: Design pressure in Pa
    '   designTemperature: Design temperature in K
    '   hotFluidDensity: Hot fluid density in kg/m³
    '   hotFluidViscosity: Hot fluid viscosity in Pa·s
    '   hotFluidThermalConductivity: Hot fluid thermal conductivity in W/m·K
    '   hotFluidSpecificHeat: Hot fluid specific heat in J/kg·K
    '   coldFluidDensity: Cold fluid density in kg/m³
    '   coldFluidViscosity: Cold fluid viscosity in Pa·s
    '   coldFluidThermalConductivity: Cold fluid thermal conductivity in W/m·K
    '   coldFluidSpecificHeat: Cold fluid specific heat in J/kg·K
    '
    ' Returns: JSON string with air-cooled heat exchanger sizing results
    '
    ' Example: =ENGIVAULT_AIR_COOLED_HEAT_EXCHANGER_SIZING(50000, 353, 333, 293, 313, 10, 15, 1000000, 423, 1000, 0.001, 0.6, 4180, 1000, 0.001, 0.6, 4180)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """heatDuty"": " & heatDuty & ", " & _
        """hotFluidInlet"": " & hotFluidInlet & ", " & _
        """hotFluidOutlet"": " & hotFluidOutlet & ", " & _
        """coldFluidInlet"": " & coldFluidInlet & ", " & _
        """coldFluidOutlet"": " & coldFluidOutlet & ", " & _
        """hotFlowRate"": " & hotFlowRate & ", " & _
        """coldFlowRate"": " & coldFlowRate & ", " & _
        """designPressure"": " & designPressure & ", " & _
        """designTemperature"": " & designTemperature & ", " & _
        """hotFluidProperties"": {" & _
            """density"": " & hotFluidDensity & ", " & _
            """viscosity"": " & hotFluidViscosity & ", " & _
            """thermalConductivity"": " & hotFluidThermalConductivity & ", " & _
            """specificHeat"": " & hotFluidSpecificHeat & _
        "}, " & _
        """coldFluidProperties"": {" & _
            """density"": " & coldFluidDensity & ", " & _
            """viscosity"": " & coldFluidViscosity & ", " & _
            """thermalConductivity"": " & coldFluidThermalConductivity & ", " & _
            """specificHeat"": " & coldFluidSpecificHeat & _
        "}" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/heat-exchangers/air-cooled-sizing", requestBody)
    
    ENGIVAULT_AIR_COOLED_HEAT_EXCHANGER_SIZING = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_AIR_COOLED_HEAT_EXCHANGER_SIZING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_AIR_COOLED_HEAT_EXCHANGER_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_HEAT_EXCHANGER_RATING( _
    area As Double, _
    hotFluidInlet As Double, _
    hotFluidOutlet As Double, _
    coldFluidInlet As Double, _
    coldFluidOutlet As Double, _
    hotFlowRate As Double, _
    coldFlowRate As Double, _
    hotFluidDensity As Double, _
    hotFluidViscosity As Double, _
    hotFluidThermalConductivity As Double, _
    hotFluidSpecificHeat As Double, _
    coldFluidDensity As Double, _
    coldFluidViscosity As Double, _
    coldFluidThermalConductivity As Double, _
    coldFluidSpecificHeat As Double _
) As String
    '
    ' Rate existing heat exchanger performance
    '
    ' Parameters:
    '   area: Heat transfer area in m²
    '   hotFluidInlet: Hot fluid inlet temperature in K
    '   hotFluidOutlet: Hot fluid outlet temperature in K
    '   coldFluidInlet: Cold fluid inlet temperature in K
    '   coldFluidOutlet: Cold fluid outlet temperature in K
    '   hotFlowRate: Hot fluid flow rate in kg/s
    '   coldFlowRate: Cold fluid flow rate in kg/s
    '   hotFluidDensity: Hot fluid density in kg/m³
    '   hotFluidViscosity: Hot fluid viscosity in Pa·s
    '   hotFluidThermalConductivity: Hot fluid thermal conductivity in W/m·K
    '   hotFluidSpecificHeat: Hot fluid specific heat in J/kg·K
    '   coldFluidDensity: Cold fluid density in kg/m³
    '   coldFluidViscosity: Cold fluid viscosity in Pa·s
    '   coldFluidThermalConductivity: Cold fluid thermal conductivity in W/m·K
    '   coldFluidSpecificHeat: Cold fluid specific heat in J/kg·K
    '
    ' Returns: JSON string with heat exchanger rating results
    '
    ' Example: =ENGIVAULT_HEAT_EXCHANGER_RATING(100, 353, 333, 293, 313, 10, 15, 1000, 0.001, 0.6, 4180, 1000, 0.001, 0.6, 4180)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    
    ' Build JSON request body
    requestBody = "{" & _
        """area"": " & area & ", " & _
        """hotFluidInlet"": " & hotFluidInlet & ", " & _
        """hotFluidOutlet"": " & hotFluidOutlet & ", " & _
        """coldFluidInlet"": " & coldFluidInlet & ", " & _
        """coldFluidOutlet"": " & coldFluidOutlet & ", " & _
        """hotFlowRate"": " & hotFlowRate & ", " & _
        """coldFlowRate"": " & coldFlowRate & ", " & _
        """hotFluidProperties"": {" & _
            """density"": " & hotFluidDensity & ", " & _
            """viscosity"": " & hotFluidViscosity & ", " & _
            """thermalConductivity"": " & hotFluidThermalConductivity & ", " & _
            """specificHeat"": " & hotFluidSpecificHeat & _
        "}, " & _
        """coldFluidProperties"": {" & _
            """density"": " & coldFluidDensity & ", " & _
            """viscosity"": " & coldFluidViscosity & ", " & _
            """thermalConductivity"": " & coldFluidThermalConductivity & ", " & _
            """specificHeat"": " & coldFluidSpecificHeat & _
        "}" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/equipment/heat-exchangers/rating", requestBody)
    
    ENGIVAULT_HEAT_EXCHANGER_RATING = response
    Exit Function
    
ErrorHandler:
    ENGIVAULT_HEAT_EXCHANGER_RATING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_HEAT_EXCHANGER_RATING: " & Err.Description
End Function

'===============================================================================
' HELPER FUNCTIONS FOR EQUIPMENT SIZING
'===============================================================================

' Note: MakeAPIRequest and ParseNumericResponse functions are imported from EngiVaultAPI module

' ============================================================================
' VESSEL SIZING FUNCTIONS
' ============================================================================

Public Function ENGIVAULT_PRESSURE_VESSEL_SIZING( _
    volume As Double, designPressure As Double, designTemperature As Double, _
    material As String, diameter As Double, length As Double, height As Double _
) As String
    ' Calculate pressure vessel sizing with ASME Section VIII compliance
    ' References: ASME Section VIII, Division 1, ASME Section II, Perry's Handbook
    
    On Error GoTo ErrorHandler
    
    Dim requestData As String
    requestData = "{"
    requestData = requestData & """volume"":" & volume & ","
    requestData = requestData & """designPressure"":" & designPressure & ","
    requestData = requestData & """designTemperature"":" & designTemperature & ","
    requestData = requestData & """material"":""" & material & ""","
    requestData = requestData & """vesselType"":""pressure_vessel"","
    requestData = requestData & """diameter"":" & diameter & ","
    requestData = requestData & """length"":" & length & ","
    requestData = requestData & """height"":" & height
    requestData = requestData & "}"
    
    ENGIVAULT_PRESSURE_VESSEL_SIZING = MakeAPIRequest("/api/v1/equipment/vessels/pressure-vessel", requestData)
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PRESSURE_VESSEL_SIZING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_PRESSURE_VESSEL_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_STORAGE_TANK_SIZING( _
    volume As Double, designPressure As Double, designTemperature As Double, _
    material As String, diameter As Double, height As Double _
) As String
    ' Calculate storage tank sizing with API 650 compliance
    ' References: API 650, API 620, ASME Section VIII
    
    On Error GoTo ErrorHandler
    
    Dim requestData As String
    requestData = "{"
    requestData = requestData & """volume"":" & volume & ","
    requestData = requestData & """designPressure"":" & designPressure & ","
    requestData = requestData & """designTemperature"":" & designTemperature & ","
    requestData = requestData & """material"":""" & material & ""","
    requestData = requestData & """vesselType"":""storage_tank"","
    requestData = requestData & """diameter"":" & diameter & ","
    requestData = requestData & """height"":" & height
    requestData = requestData & "}"
    
    ENGIVAULT_STORAGE_TANK_SIZING = MakeAPIRequest("/api/v1/equipment/vessels/storage-tank", requestData)
    Exit Function
    
ErrorHandler:
    ENGIVAULT_STORAGE_TANK_SIZING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_STORAGE_TANK_SIZING: " & Err.Description
End Function

Public Function ENGIVAULT_SEPARATOR_SIZING( _
    volume As Double, designPressure As Double, designTemperature As Double, _
    material As String, diameter As Double, length As Double _
) As String
    ' Calculate separator sizing with API 12J compliance
    ' References: API 12J, ASME Section VIII, Perry's Handbook
    
    On Error GoTo ErrorHandler
    
    Dim requestData As String
    requestData = "{"
    requestData = requestData & """volume"":" & volume & ","
    requestData = requestData & """designPressure"":" & designPressure & ","
    requestData = requestData & """designTemperature"":" & designTemperature & ","
    requestData = requestData & """material"":""" & material & ""","
    requestData = requestData & """vesselType"":""separator"","
    requestData = requestData & """diameter"":" & diameter & ","
    requestData = requestData & """length"":" & length
    requestData = requestData & "}"
    
    ENGIVAULT_SEPARATOR_SIZING = MakeAPIRequest("/api/v1/equipment/vessels/separator", requestData)
    Exit Function
    
ErrorHandler:
    ENGIVAULT_SEPARATOR_SIZING = "Error: " & Err.Description
    Debug.Print "Error in ENGIVAULT_SEPARATOR_SIZING: " & Err.Description
End Function
