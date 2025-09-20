Attribute VB_Name = "EngiVaultHeatTransfer"
'===============================================================================
' EngiVault Excel Integration - Heat Transfer Module
' VBA Module for Heat Transfer Calculations
'
' Version: 1.1.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' HEAT TRANSFER CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_LMTD( _
    tHotIn As Double, _
    tHotOut As Double, _
    tColdIn As Double, _
    tColdOut As Double, _
    Optional flowArrangement As String = "counterflow" _
) As Double
    '
    ' Calculate Log Mean Temperature Difference (LMTD)
    '
    ' Parameters:
    '   tHotIn: Hot fluid inlet temperature in K
    '   tHotOut: Hot fluid outlet temperature in K
    '   tColdIn: Cold fluid inlet temperature in K
    '   tColdOut: Cold fluid outlet temperature in K
    '   flowArrangement: Flow arrangement ("counterflow" or "parallel")
    '
    ' Returns: LMTD in K
    '
    ' Example: =ENGIVAULT_LMTD(353, 333, 293, 313, "counterflow")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim lmtd As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """tHotIn"": " & tHotIn & ", " & _
        """tHotOut"": " & tHotOut & ", " & _
        """tColdIn"": " & tColdIn & ", " & _
        """tColdOut"": " & tColdOut & ", " & _
        """flowArrangement"": """ & flowArrangement & """" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/heat-transfer/lmtd", requestBody)
    
    ' Parse response and extract LMTD
    lmtd = ParseNumericResponse(response, "lmtd")
    
    ENGIVAULT_LMTD = lmtd
    Exit Function
    
ErrorHandler:
    ENGIVAULT_LMTD = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_LMTD: " & Err.Description
End Function

Public Function ENGIVAULT_HEAT_EXCHANGER_AREA( _
    heatDuty As Double, _
    overallU As Double, _
    tHotIn As Double, _
    tHotOut As Double, _
    tColdIn As Double, _
    tColdOut As Double, _
    Optional flowArrangement As String = "counterflow" _
) As Double
    '
    ' Calculate heat exchanger area using LMTD method
    '
    ' Parameters:
    '   heatDuty: Heat duty in W
    '   overallU: Overall heat transfer coefficient in W/m²·K
    '   tHotIn: Hot fluid inlet temperature in K
    '   tHotOut: Hot fluid outlet temperature in K
    '   tColdIn: Cold fluid inlet temperature in K
    '   tColdOut: Cold fluid outlet temperature in K
    '   flowArrangement: Flow arrangement ("counterflow", "parallel", "crossflow")
    '
    ' Returns: Heat transfer area in m²
    '
    ' Example: =ENGIVAULT_HEAT_EXCHANGER_AREA(50000, 500, 353, 333, 293, 313)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim area As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """heatDuty"": " & heatDuty & ", " & _
        """overallU"": " & overallU & ", " & _
        """tHotIn"": " & tHotIn & ", " & _
        """tHotOut"": " & tHotOut & ", " & _
        """tColdIn"": " & tColdIn & ", " & _
        """tColdOut"": " & tColdOut & ", " & _
        """flowArrangement"": """ & flowArrangement & """" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/heat-transfer/heat-exchanger-area", requestBody)
    
    ' Parse response and extract area
    area = ParseNumericResponse(response, "area")
    
    ENGIVAULT_HEAT_EXCHANGER_AREA = area
    Exit Function
    
ErrorHandler:
    ENGIVAULT_HEAT_EXCHANGER_AREA = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_HEAT_EXCHANGER_AREA: " & Err.Description
End Function

Public Function ENGIVAULT_EFFECTIVENESS( _
    ntu As Double, _
    capacityRatio As Double, _
    flowArrangement As String _
) As Double
    '
    ' Calculate heat exchanger effectiveness using NTU method
    '
    ' Parameters:
    '   ntu: Number of transfer units
    '   capacityRatio: Capacity rate ratio (Cmin/Cmax, 0-1)
    '   flowArrangement: Flow arrangement ("counterflow", "parallel", "crossflow_unmixed")
    '
    ' Returns: Effectiveness (0-1)
    '
    ' Example: =ENGIVAULT_EFFECTIVENESS(2.5, 0.6, "counterflow")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim effectiveness As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """ntu"": " & ntu & ", " & _
        """capacityRatio"": " & capacityRatio & ", " & _
        """flowArrangement"": """ & flowArrangement & """" & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/heat-transfer/effectiveness-ntu", requestBody)
    
    ' Parse response and extract effectiveness
    effectiveness = ParseNumericResponse(response, "effectiveness")
    
    ENGIVAULT_EFFECTIVENESS = effectiveness
    Exit Function
    
ErrorHandler:
    ENGIVAULT_EFFECTIVENESS = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_EFFECTIVENESS: " & Err.Description
End Function

'===============================================================================
' THERMAL PROPERTY FUNCTIONS
'===============================================================================

Public Function THERMAL_CONDUCTIVITY_WATER(temperature As Double) As Double
    '
    ' Get water thermal conductivity at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius (0-100°C)
    '
    ' Returns: Thermal conductivity in W/m·K
    '
    ' Example: =THERMAL_CONDUCTIVITY_WATER(20)
    '
    On Error GoTo ErrorHandler
    
    ' Validate temperature range
    If temperature < 0 Or temperature > 100 Then
        Err.Raise vbObjectError + 3001, "EngiVault", "Temperature must be between 0 and 100°C"
    End If
    
    ' Polynomial approximation for water thermal conductivity
    Dim k As Double
    k = 0.5707 + 0.0017 * temperature - 0.0000068 * temperature ^ 2
    
    THERMAL_CONDUCTIVITY_WATER = k
    Exit Function
    
ErrorHandler:
    THERMAL_CONDUCTIVITY_WATER = CVErr(xlErrValue)
    Debug.Print "Error in THERMAL_CONDUCTIVITY_WATER: " & Err.Description
End Function

Public Function SPECIFIC_HEAT_WATER(temperature As Double) As Double
    '
    ' Get water specific heat at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius (0-100°C)
    '
    ' Returns: Specific heat in J/kg·K
    '
    ' Example: =SPECIFIC_HEAT_WATER(20)
    '
    On Error GoTo ErrorHandler
    
    ' Validate temperature range
    If temperature < 0 Or temperature > 100 Then
        Err.Raise vbObjectError + 3002, "EngiVault", "Temperature must be between 0 and 100°C"
    End If
    
    ' Polynomial approximation for water specific heat
    Dim cp As Double
    cp = 4217.4 - 2.0787 * temperature + 0.01404 * temperature ^ 2 - 0.0000131 * temperature ^ 3
    
    SPECIFIC_HEAT_WATER = cp
    Exit Function
    
ErrorHandler:
    SPECIFIC_HEAT_WATER = CVErr(xlErrValue)
    Debug.Print "Error in SPECIFIC_HEAT_WATER: " & Err.Description
End Function

Public Function PRANDTL_NUMBER_WATER(temperature As Double) As Double
    '
    ' Calculate Prandtl number for water at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius (0-100°C)
    '
    ' Returns: Prandtl number (dimensionless)
    '
    ' Example: =PRANDTL_NUMBER_WATER(20)
    '
    On Error GoTo ErrorHandler
    
    Dim viscosity As Double
    Dim specificHeat As Double
    Dim thermalConductivity As Double
    Dim prandtl As Double
    
    ' Get properties
    viscosity = WATER_VISCOSITY(temperature)
    specificHeat = SPECIFIC_HEAT_WATER(temperature)
    thermalConductivity = THERMAL_CONDUCTIVITY_WATER(temperature)
    
    ' Calculate Prandtl number
    prandtl = (viscosity * specificHeat) / thermalConductivity
    
    PRANDTL_NUMBER_WATER = prandtl
    Exit Function
    
ErrorHandler:
    PRANDTL_NUMBER_WATER = CVErr(xlErrValue)
    Debug.Print "Error in PRANDTL_NUMBER_WATER: " & Err.Description
End Function

'===============================================================================
' HEAT TRANSFER COEFFICIENT CALCULATIONS
'===============================================================================

Public Function NUSSELT_FLAT_PLATE( _
    reynoldsNumber As Double, _
    prandtlNumber As Double _
) As Double
    '
    ' Calculate Nusselt number for flat plate in parallel flow
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number
    '   prandtlNumber: Prandtl number
    '
    ' Returns: Nusselt number
    '
    ' Example: =NUSSELT_FLAT_PLATE(50000, 7)
    '
    On Error GoTo ErrorHandler
    
    Dim nusselt As Double
    
    If reynoldsNumber < 500000 Then
        ' Laminar flow
        nusselt = 0.332 * (reynoldsNumber ^ 0.5) * (prandtlNumber ^ (1 / 3))
    Else
        ' Turbulent flow
        nusselt = 0.0296 * (reynoldsNumber ^ 0.8) * (prandtlNumber ^ (1 / 3))
    End If
    
    NUSSELT_FLAT_PLATE = nusselt
    Exit Function
    
ErrorHandler:
    NUSSELT_FLAT_PLATE = CVErr(xlErrValue)
    Debug.Print "Error in NUSSELT_FLAT_PLATE: " & Err.Description
End Function

Public Function NUSSELT_TUBE_INTERNAL( _
    reynoldsNumber As Double, _
    prandtlNumber As Double _
) As Double
    '
    ' Calculate Nusselt number for internal flow in tubes
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number
    '   prandtlNumber: Prandtl number
    '
    ' Returns: Nusselt number
    '
    ' Example: =NUSSELT_TUBE_INTERNAL(10000, 7)
    '
    On Error GoTo ErrorHandler
    
    Dim nusselt As Double
    
    If reynoldsNumber < 2300 Then
        ' Laminar flow - fully developed
        nusselt = 3.66
    Else
        ' Turbulent flow - Dittus-Boelter equation
        nusselt = 0.023 * (reynoldsNumber ^ 0.8) * (prandtlNumber ^ 0.4)
    End If
    
    NUSSELT_TUBE_INTERNAL = nusselt
    Exit Function
    
ErrorHandler:
    NUSSELT_TUBE_INTERNAL = CVErr(xlErrValue)
    Debug.Print "Error in NUSSELT_TUBE_INTERNAL: " & Err.Description
End Function

Public Function HEAT_TRANSFER_COEFFICIENT( _
    nusseltNumber As Double, _
    thermalConductivity As Double, _
    characteristicLength As Double _
) As Double
    '
    ' Calculate convective heat transfer coefficient
    '
    ' Parameters:
    '   nusseltNumber: Nusselt number
    '   thermalConductivity: Fluid thermal conductivity in W/m·K
    '   characteristicLength: Characteristic length in m
    '
    ' Returns: Heat transfer coefficient in W/m²·K
    '
    ' Example: =HEAT_TRANSFER_COEFFICIENT(50, 0.6, 0.1)
    '
    On Error GoTo ErrorHandler
    
    Dim htc As Double
    
    htc = (nusseltNumber * thermalConductivity) / characteristicLength
    
    HEAT_TRANSFER_COEFFICIENT = htc
    Exit Function
    
ErrorHandler:
    HEAT_TRANSFER_COEFFICIENT = CVErr(xlErrValue)
    Debug.Print "Error in HEAT_TRANSFER_COEFFICIENT: " & Err.Description
End Function

'===============================================================================
' HEAT EXCHANGER DESIGN FUNCTIONS
'===============================================================================

Public Function HEAT_DUTY_REQUIRED( _
    massFlowRate As Double, _
    specificHeat As Double, _
    temperatureChange As Double _
) As Double
    '
    ' Calculate heat duty required for fluid heating/cooling
    '
    ' Parameters:
    '   massFlowRate: Mass flow rate in kg/s
    '   specificHeat: Specific heat in J/kg·K
    '   temperatureChange: Temperature change in K
    '
    ' Returns: Heat duty in W
    '
    ' Example: =HEAT_DUTY_REQUIRED(5, 4180, 20)
    '
    On Error GoTo ErrorHandler
    
    Dim heatDuty As Double
    
    heatDuty = massFlowRate * specificHeat * temperatureChange
    
    HEAT_DUTY_REQUIRED = heatDuty
    Exit Function
    
ErrorHandler:
    HEAT_DUTY_REQUIRED = CVErr(xlErrValue)
    Debug.Print "Error in HEAT_DUTY_REQUIRED: " & Err.Description
End Function

Public Function NTU_FROM_AREA( _
    area As Double, _
    overallU As Double, _
    minCapacityRate As Double _
) As Double
    '
    ' Calculate Number of Transfer Units (NTU) from area
    '
    ' Parameters:
    '   area: Heat transfer area in m²
    '   overallU: Overall heat transfer coefficient in W/m²·K
    '   minCapacityRate: Minimum capacity rate in W/K
    '
    ' Returns: NTU (dimensionless)
    '
    ' Example: =NTU_FROM_AREA(10, 500, 2000)
    '
    On Error GoTo ErrorHandler
    
    Dim ntu As Double
    
    ntu = (overallU * area) / minCapacityRate
    
    NTU_FROM_AREA = ntu
    Exit Function
    
ErrorHandler:
    NTU_FROM_AREA = CVErr(xlErrValue)
    Debug.Print "Error in NTU_FROM_AREA: " & Err.Description
End Function

Public Function CAPACITY_RATE( _
    massFlowRate As Double, _
    specificHeat As Double _
) As Double
    '
    ' Calculate capacity rate (mass flow rate × specific heat)
    '
    ' Parameters:
    '   massFlowRate: Mass flow rate in kg/s
    '   specificHeat: Specific heat in J/kg·K
    '
    ' Returns: Capacity rate in W/K
    '
    ' Example: =CAPACITY_RATE(2, 4180)
    '
    On Error GoTo ErrorHandler
    
    Dim capacityRate As Double
    
    capacityRate = massFlowRate * specificHeat
    
    CAPACITY_RATE = capacityRate
    Exit Function
    
ErrorHandler:
    CAPACITY_RATE = CVErr(xlErrValue)
    Debug.Print "Error in CAPACITY_RATE: " & Err.Description
End Function

'===============================================================================
' TEMPERATURE CONVERSION FUNCTIONS
'===============================================================================

Public Function CELSIUS_TO_KELVIN(celsius As Double) As Double
    '
    ' Convert temperature from Celsius to Kelvin
    '
    ' Parameters:
    '   celsius: Temperature in Celsius
    '
    ' Returns: Temperature in Kelvin
    '
    ' Example: =CELSIUS_TO_KELVIN(20)
    '
    CELSIUS_TO_KELVIN = celsius + 273.15
End Function

Public Function KELVIN_TO_CELSIUS(kelvin As Double) As Double
    '
    ' Convert temperature from Kelvin to Celsius
    '
    ' Parameters:
    '   kelvin: Temperature in Kelvin
    '
    ' Returns: Temperature in Celsius
    '
    ' Example: =KELVIN_TO_CELSIUS(293.15)
    '
    KELVIN_TO_CELSIUS = kelvin - 273.15
End Function

Public Function FAHRENHEIT_TO_CELSIUS(fahrenheit As Double) As Double
    '
    ' Convert temperature from Fahrenheit to Celsius
    '
    ' Parameters:
    '   fahrenheit: Temperature in Fahrenheit
    '
    ' Returns: Temperature in Celsius
    '
    ' Example: =FAHRENHEIT_TO_CELSIUS(68)
    '
    FAHRENHEIT_TO_CELSIUS = (fahrenheit - 32) * 5 / 9
End Function

Public Function CELSIUS_TO_FAHRENHEIT(celsius As Double) As Double
    '
    ' Convert temperature from Celsius to Fahrenheit
    '
    ' Parameters:
    '   celsius: Temperature in Celsius
    '
    ' Returns: Temperature in Fahrenheit
    '
    ' Example: =CELSIUS_TO_FAHRENHEIT(20)
    '
    CELSIUS_TO_FAHRENHEIT = celsius * 9 / 5 + 32
End Function

'===============================================================================
' HEAT TRANSFER VALIDATION FUNCTIONS
'===============================================================================

Public Function VALIDATE_HEAT_EXCHANGER( _
    effectiveness As Double, _
    npshMargin As Double, _
    velocityHot As Double, _
    velocityCold As Double _
) As String
    '
    ' Validate heat exchanger design parameters
    '
    ' Parameters:
    '   effectiveness: Heat exchanger effectiveness (0-1)
    '   npshMargin: NPSH margin in meters (if applicable)
    '   velocityHot: Hot fluid velocity in m/s
    '   velocityCold: Cold fluid velocity in m/s
    '
    ' Returns: Validation result ("Excellent", "Good", "Acceptable", "Poor")
    '
    ' Example: =VALIDATE_HEAT_EXCHANGER(0.8, 3, 2.5, 1.8)
    '
    On Error GoTo ErrorHandler
    
    Dim score As Integer
    score = 0
    
    ' Score effectiveness
    If effectiveness > 0.8 Then
        score = score + 3
    ElseIf effectiveness > 0.6 Then
        score = score + 2
    ElseIf effectiveness > 0.4 Then
        score = score + 1
    End If
    
    ' Score NPSH margin (if applicable)
    If npshMargin > 0 Then
        If npshMargin > 3 Then
            score = score + 2
        ElseIf npshMargin > 1.5 Then
            score = score + 1
        End If
    Else
        score = score + 1 ' Neutral if not applicable
    End If
    
    ' Score velocities
    If velocityHot <= 3 And velocityHot >= 1 Then score = score + 1
    If velocityCold <= 3 And velocityCold >= 1 Then score = score + 1
    
    ' Determine overall rating
    If score >= 6 Then
        VALIDATE_HEAT_EXCHANGER = "Excellent"
    ElseIf score >= 4 Then
        VALIDATE_HEAT_EXCHANGER = "Good"
    ElseIf score >= 2 Then
        VALIDATE_HEAT_EXCHANGER = "Acceptable"
    Else
        VALIDATE_HEAT_EXCHANGER = "Poor"
    End If
    
    Exit Function
    
ErrorHandler:
    VALIDATE_HEAT_EXCHANGER = "Error"
    Debug.Print "Error in VALIDATE_HEAT_EXCHANGER: " & Err.Description
End Function

'===============================================================================
' ECONOMIC ANALYSIS FUNCTIONS
'===============================================================================

Public Function HEAT_EXCHANGER_COST_ESTIMATE( _
    area As Double, _
    material As String, _
    Optional pressure As Double = 1 _
) As Double
    '
    ' Estimate heat exchanger cost based on area and material
    '
    ' Parameters:
    '   area: Heat transfer area in m²
    '   material: Material type ("carbon_steel", "stainless_steel", "titanium")
    '   pressure: Design pressure in bar (optional, default: 1)
    '
    ' Returns: Estimated cost in USD
    '
    ' Example: =HEAT_EXCHANGER_COST_ESTIMATE(25, "stainless_steel", 10)
    '
    On Error GoTo ErrorHandler
    
    Dim baseCost As Double
    Dim materialFactor As Double
    Dim pressureFactor As Double
    Dim totalCost As Double
    
    ' Base cost per m² (carbon steel, 1 bar)
    baseCost = 1500 ' USD/m²
    
    ' Material factors
    Select Case LCase(material)
        Case "carbon_steel"
            materialFactor = 1.0
        Case "stainless_steel"
            materialFactor = 2.5
        Case "titanium"
            materialFactor = 8.0
        Case "hastelloy"
            materialFactor = 12.0
        Case Else
            materialFactor = 1.0 ' Default to carbon steel
    End Select
    
    ' Pressure factor
    If pressure <= 1 Then
        pressureFactor = 1.0
    ElseIf pressure <= 10 Then
        pressureFactor = 1.0 + 0.1 * (pressure - 1)
    Else
        pressureFactor = 2.0 + 0.05 * (pressure - 10)
    End If
    
    ' Calculate total cost
    totalCost = baseCost * area * materialFactor * pressureFactor
    
    HEAT_EXCHANGER_COST_ESTIMATE = totalCost
    Exit Function
    
ErrorHandler:
    HEAT_EXCHANGER_COST_ESTIMATE = CVErr(xlErrValue)
    Debug.Print "Error in HEAT_EXCHANGER_COST_ESTIMATE: " & Err.Description
End Function

'===============================================================================
' HELPER FUNCTIONS FOR HEAT TRANSFER
'===============================================================================

' Note: MakeAPIRequest and ParseNumericResponse functions are imported from EngiVaultAPI module
