Attribute VB_Name = "EngiVaultFluidMechanics"
'===============================================================================
' EngiVault Excel Integration - Fluid Mechanics Module
' VBA Module for Advanced Fluid Mechanics Calculations
'
' Version: 1.2.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' OPEN CHANNEL FLOW CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_MANNING_FLOW( _
    flowRate As Double, _
    channelWidth As Double, _
    channelSlope As Double, _
    manningSCoeff As Double, _
    Optional channelShape As String = "rectangular", _
    Optional sideSlope As Double = 0 _
) As Double
    '
    ' Calculate normal depth using Manning's equation
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   channelWidth: Channel width in m
    '   channelSlope: Channel slope (dimensionless, S₀)
    '   manningSCoeff: Manning's roughness coefficient
    '   channelShape: Channel shape ("rectangular", "trapezoidal", "circular")
    '   sideSlope: Side slope for trapezoidal (m:1)
    '
    ' Returns: Normal depth in m
    '
    ' Example: =ENGIVAULT_MANNING_FLOW(5, 3, 0.001, 0.03, "rectangular")
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim normalDepth As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """channelWidth"": " & channelWidth & ", " & _
        """channelSlope"": " & channelSlope & ", " & _
        """manningSCoeff"": " & manningSCoeff & ", " & _
        """channelShape"": """ & channelShape & """, " & _
        """sideSlope"": " & sideSlope & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/v1/fluid-mechanics/open-channel-flow", requestBody)
    
    ' Parse response and extract normal depth
    normalDepth = ParseNumericResponse(response, "normalDepth")
    
    ENGIVAULT_MANNING_FLOW = normalDepth
    Exit Function
    
ErrorHandler:
    ENGIVAULT_MANNING_FLOW = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_MANNING_FLOW: " & Err.Description
End Function

Public Function ENGIVAULT_CRITICAL_DEPTH( _
    flowRate As Double, _
    channelWidth As Double, _
    Optional channelShape As String = "rectangular", _
    Optional sideSlope As Double = 0 _
) As Double
    '
    ' Calculate critical depth for open channel flow
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   channelWidth: Channel width in m
    '   channelShape: Channel shape ("rectangular", "trapezoidal", "circular")
    '   sideSlope: Side slope for trapezoidal (m:1)
    '
    ' Returns: Critical depth in m
    '
    ' Example: =ENGIVAULT_CRITICAL_DEPTH(5, 3, "rectangular")
    '
    
    On Error GoTo ErrorHandler
    
    ' For rectangular channel, use direct formula
    If LCase(channelShape) = "rectangular" Then
        ENGIVAULT_CRITICAL_DEPTH = ((flowRate ^ 2) / (9.81 * channelWidth ^ 2)) ^ (1 / 3)
    Else
        ' For other shapes, use API call with minimal slope
        Dim requestBody As String
        Dim response As String
        Dim criticalDepth As Double
        
        requestBody = "{" & _
            """flowRate"": " & flowRate & ", " & _
            """channelWidth"": " & channelWidth & ", " & _
            """channelSlope"": 0.001, " & _
            """manningSCoeff"": 0.03, " & _
            """channelShape"": """ & channelShape & """, " & _
            """sideSlope"": " & sideSlope & _
            "}"
        
        response = MakeAPIRequest("POST", "/api/v1/fluid-mechanics/open-channel-flow", requestBody)
        criticalDepth = ParseNumericResponse(response, "criticalDepth")
        
        ENGIVAULT_CRITICAL_DEPTH = criticalDepth
    End If
    
    Exit Function
    
ErrorHandler:
    ENGIVAULT_CRITICAL_DEPTH = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_CRITICAL_DEPTH: " & Err.Description
End Function

Public Function ENGIVAULT_FROUDE_NUMBER( _
    velocity As Double, _
    hydraulicDepth As Double _
) As Double
    '
    ' Calculate Froude number for open channel flow
    '
    ' Parameters:
    '   velocity: Average velocity in m/s
    '   hydraulicDepth: Hydraulic depth in m
    '
    ' Returns: Froude number (dimensionless)
    '
    ' Example: =ENGIVAULT_FROUDE_NUMBER(2.5, 1.2)
    '
    On Error GoTo ErrorHandler
    
    Dim froudeNumber As Double
    
    froudeNumber = velocity / Sqr(9.81 * hydraulicDepth)
    
    ENGIVAULT_FROUDE_NUMBER = froudeNumber
    Exit Function
    
ErrorHandler:
    ENGIVAULT_FROUDE_NUMBER = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_FROUDE_NUMBER: " & Err.Description
End Function

'===============================================================================
' COMPRESSIBLE FLOW CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_MACH_NUMBER( _
    velocity As Double, _
    temperature As Double, _
    Optional gamma As Double = 1.4, _
    Optional gasConstant As Double = 287 _
) As Double
    '
    ' Calculate Mach number for compressible flow
    '
    ' Parameters:
    '   velocity: Velocity in m/s
    '   temperature: Temperature in K
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '   gasConstant: Specific gas constant in J/kg·K (default: 287 for air)
    '
    ' Returns: Mach number (dimensionless)
    '
    ' Example: =ENGIVAULT_MACH_NUMBER(100, 288, 1.4, 287)
    '
    
    On Error GoTo ErrorHandler
    
    Dim speedOfSound As Double
    Dim machNumber As Double
    
    ' Calculate speed of sound
    speedOfSound = Sqr(gamma * gasConstant * temperature)
    
    ' Calculate Mach number
    machNumber = velocity / speedOfSound
    
    ENGIVAULT_MACH_NUMBER = machNumber
    Exit Function
    
ErrorHandler:
    ENGIVAULT_MACH_NUMBER = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_MACH_NUMBER: " & Err.Description
End Function

Public Function ENGIVAULT_SPEED_OF_SOUND( _
    temperature As Double, _
    Optional gamma As Double = 1.4, _
    Optional gasConstant As Double = 287 _
) As Double
    '
    ' Calculate speed of sound in gas
    '
    ' Parameters:
    '   temperature: Temperature in K
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '   gasConstant: Specific gas constant in J/kg·K (default: 287 for air)
    '
    ' Returns: Speed of sound in m/s
    '
    ' Example: =ENGIVAULT_SPEED_OF_SOUND(288, 1.4, 287)
    '
    On Error GoTo ErrorHandler
    
    Dim speedOfSound As Double
    
    speedOfSound = Sqr(gamma * gasConstant * temperature)
    
    ENGIVAULT_SPEED_OF_SOUND = speedOfSound
    Exit Function
    
ErrorHandler:
    ENGIVAULT_SPEED_OF_SOUND = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_SPEED_OF_SOUND: " & Err.Description
End Function

Public Function ENGIVAULT_STAGNATION_PRESSURE( _
    staticPressure As Double, _
    machNumber As Double, _
    Optional gamma As Double = 1.4 _
) As Double
    '
    ' Calculate stagnation pressure from static conditions
    '
    ' Parameters:
    '   staticPressure: Static pressure in Pa
    '   machNumber: Mach number
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '
    ' Returns: Stagnation pressure in Pa
    '
    ' Example: =ENGIVAULT_STAGNATION_PRESSURE(101325, 0.5, 1.4)
    '
    On Error GoTo ErrorHandler
    
    Dim stagnationPressure As Double
    Dim pressureFactor As Double
    
    pressureFactor = (1 + ((gamma - 1) / 2) * machNumber ^ 2) ^ (gamma / (gamma - 1))
    stagnationPressure = staticPressure * pressureFactor
    
    ENGIVAULT_STAGNATION_PRESSURE = stagnationPressure
    Exit Function
    
ErrorHandler:
    ENGIVAULT_STAGNATION_PRESSURE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_STAGNATION_PRESSURE: " & Err.Description
End Function

Public Function ENGIVAULT_STAGNATION_TEMPERATURE( _
    staticTemperature As Double, _
    machNumber As Double, _
    Optional gamma As Double = 1.4 _
) As Double
    '
    ' Calculate stagnation temperature from static conditions
    '
    ' Parameters:
    '   staticTemperature: Static temperature in K
    '   machNumber: Mach number
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '
    ' Returns: Stagnation temperature in K
    '
    ' Example: =ENGIVAULT_STAGNATION_TEMPERATURE(288, 0.5, 1.4)
    '
    On Error GoTo ErrorHandler
    
    Dim stagnationTemperature As Double
    Dim temperatureFactor As Double
    
    temperatureFactor = 1 + ((gamma - 1) / 2) * machNumber ^ 2
    stagnationTemperature = staticTemperature * temperatureFactor
    
    ENGIVAULT_STAGNATION_TEMPERATURE = stagnationTemperature
    Exit Function
    
ErrorHandler:
    ENGIVAULT_STAGNATION_TEMPERATURE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_STAGNATION_TEMPERATURE: " & Err.Description
End Function

'===============================================================================
' EXTERNAL FLOW CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_DRAG_COEFFICIENT( _
    reynoldsNumber As Double, _
    geometry As String _
) As Double
    '
    ' Calculate drag coefficient for external flow
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number
    '   geometry: Object geometry ("sphere", "cylinder", "flat_plate")
    '
    ' Returns: Drag coefficient (dimensionless)
    '
    ' Example: =ENGIVAULT_DRAG_COEFFICIENT(100000, "sphere")
    '
    On Error GoTo ErrorHandler
    
    Dim dragCoeff As Double
    
    Select Case LCase(geometry)
        Case "sphere"
            If reynoldsNumber < 1 Then
                dragCoeff = 24 / reynoldsNumber ' Stokes flow
            ElseIf reynoldsNumber < 1000 Then
                dragCoeff = 24 / reynoldsNumber * (1 + 0.15 * reynoldsNumber ^ 0.687)
            ElseIf reynoldsNumber < 200000 Then
                dragCoeff = 0.44 ' Newton's law region
            Else
                dragCoeff = 0.1 ' Post-critical region
            End If
            
        Case "cylinder"
            If reynoldsNumber < 1 Then
                dragCoeff = 8 * Application.WorksheetFunction.Pi / reynoldsNumber
            ElseIf reynoldsNumber < 40 Then
                dragCoeff = 5.8 / Sqr(reynoldsNumber)
            ElseIf reynoldsNumber < 1000 Then
                dragCoeff = 1.2
            ElseIf reynoldsNumber < 200000 Then
                dragCoeff = 0.3
            Else
                dragCoeff = 0.7 ' Post-critical
            End If
            
        Case "flat_plate"
            If reynoldsNumber < 500000 Then
                dragCoeff = 1.328 / Sqr(reynoldsNumber) ' Laminar
            Else
                dragCoeff = 0.074 / (reynoldsNumber ^ 0.2) ' Turbulent
            End If
            
        Case Else
            dragCoeff = 0.44 ' Default to sphere
    End Select
    
    ENGIVAULT_DRAG_COEFFICIENT = dragCoeff
    Exit Function
    
ErrorHandler:
    ENGIVAULT_DRAG_COEFFICIENT = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_DRAG_COEFFICIENT: " & Err.Description
End Function

Public Function ENGIVAULT_DRAG_FORCE( _
    dragCoefficient As Double, _
    density As Double, _
    velocity As Double, _
    frontalArea As Double _
) As Double
    '
    ' Calculate drag force on object
    '
    ' Parameters:
    '   dragCoefficient: Drag coefficient (dimensionless)
    '   density: Fluid density in kg/m³
    '   velocity: Velocity in m/s
    '   frontalArea: Frontal area in m²
    '
    ' Returns: Drag force in N
    '
    ' Example: =ENGIVAULT_DRAG_FORCE(0.44, 1.225, 20, 0.00785)
    '
    On Error GoTo ErrorHandler
    
    Dim dragForce As Double
    Dim dynamicPressure As Double
    
    dynamicPressure = 0.5 * density * velocity ^ 2
    dragForce = dragCoefficient * dynamicPressure * frontalArea
    
    ENGIVAULT_DRAG_FORCE = dragForce
    Exit Function
    
ErrorHandler:
    ENGIVAULT_DRAG_FORCE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_DRAG_FORCE: " & Err.Description
End Function

'===============================================================================
' BOUNDARY LAYER CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_BOUNDARY_LAYER_THICKNESS( _
    reynoldsNumber As Double, _
    distance As Double, _
    Optional flowRegime As String = "auto" _
) As Double
    '
    ' Calculate boundary layer thickness
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number based on distance
    '   distance: Distance from leading edge in m
    '   flowRegime: Flow regime ("laminar", "turbulent", "auto")
    '
    ' Returns: Boundary layer thickness in m
    '
    ' Example: =ENGIVAULT_BOUNDARY_LAYER_THICKNESS(100000, 0.5, "laminar")
    '
    On Error GoTo ErrorHandler
    
    Dim thickness As Double
    Dim regime As String
    
    ' Determine flow regime if auto
    If LCase(flowRegime) = "auto" Then
        If reynoldsNumber < 500000 Then
            regime = "laminar"
        Else
            regime = "turbulent"
        End If
    Else
        regime = LCase(flowRegime)
    End If
    
    ' Calculate thickness based on regime
    If regime = "laminar" Then
        thickness = 5# * distance / Sqr(reynoldsNumber)
    Else ' turbulent
        thickness = 0.37 * distance / (reynoldsNumber ^ 0.2)
    End If
    
    ENGIVAULT_BOUNDARY_LAYER_THICKNESS = thickness
    Exit Function
    
ErrorHandler:
    ENGIVAULT_BOUNDARY_LAYER_THICKNESS = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_BOUNDARY_LAYER_THICKNESS: " & Err.Description
End Function

Public Function ENGIVAULT_SKIN_FRICTION( _
    reynoldsNumber As Double, _
    Optional flowRegime As String = "auto" _
) As Double
    '
    ' Calculate skin friction coefficient
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number
    '   flowRegime: Flow regime ("laminar", "turbulent", "auto")
    '
    ' Returns: Skin friction coefficient (dimensionless)
    '
    ' Example: =ENGIVAULT_SKIN_FRICTION(100000, "laminar")
    '
    On Error GoTo ErrorHandler
    
    Dim skinFriction As Double
    Dim regime As String
    
    ' Determine flow regime if auto
    If LCase(flowRegime) = "auto" Then
        If reynoldsNumber < 500000 Then
            regime = "laminar"
        Else
            regime = "turbulent"
        End If
    Else
        regime = LCase(flowRegime)
    End If
    
    ' Calculate skin friction based on regime
    If regime = "laminar" Then
        skinFriction = 0.664 / Sqr(reynoldsNumber)
    Else ' turbulent
        skinFriction = 0.058 / (reynoldsNumber ^ 0.2)
    End If
    
    ENGIVAULT_SKIN_FRICTION = skinFriction
    Exit Function
    
ErrorHandler:
    ENGIVAULT_SKIN_FRICTION = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_SKIN_FRICTION: " & Err.Description
End Function

'===============================================================================
' GAS DYNAMICS CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_NORMAL_SHOCK_PRESSURE( _
    machNumber1 As Double, _
    Optional gamma As Double = 1.4 _
) As Double
    '
    ' Calculate pressure ratio across normal shock
    '
    ' Parameters:
    '   machNumber1: Upstream Mach number (must be > 1)
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '
    ' Returns: Pressure ratio p₂/p₁
    '
    ' Example: =ENGIVAULT_NORMAL_SHOCK_PRESSURE(2.0, 1.4)
    '
    On Error GoTo ErrorHandler
    
    If machNumber1 <= 1 Then
        Err.Raise vbObjectError + 4001, "EngiVault", "Normal shock requires supersonic flow (M₁ > 1)"
    End If
    
    Dim pressureRatio As Double
    Dim M1 As Double
    Dim g As Double
    
    M1 = machNumber1
    g = gamma
    
    pressureRatio = (2 * g * M1 ^ 2 - (g - 1)) / (g + 1)
    
    ENGIVAULT_NORMAL_SHOCK_PRESSURE = pressureRatio
    Exit Function
    
ErrorHandler:
    ENGIVAULT_NORMAL_SHOCK_PRESSURE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_NORMAL_SHOCK_PRESSURE: " & Err.Description
End Function

Public Function ENGIVAULT_NORMAL_SHOCK_MACH( _
    machNumber1 As Double, _
    Optional gamma As Double = 1.4 _
) As Double
    '
    ' Calculate downstream Mach number across normal shock
    '
    ' Parameters:
    '   machNumber1: Upstream Mach number (must be > 1)
    '   gamma: Specific heat ratio (default: 1.4 for air)
    '
    ' Returns: Downstream Mach number
    '
    ' Example: =ENGIVAULT_NORMAL_SHOCK_MACH(2.0, 1.4)
    '
    On Error GoTo ErrorHandler
    
    If machNumber1 <= 1 Then
        Err.Raise vbObjectError + 4002, "EngiVault", "Normal shock requires supersonic flow (M₁ > 1)"
    End If
    
    Dim machNumber2 As Double
    Dim M1 As Double
    Dim g As Double
    
    M1 = machNumber1
    g = gamma
    
    machNumber2 = Sqr((M1 ^ 2 + 2 / (g - 1)) / (2 * g * M1 ^ 2 / (g - 1) - 1))
    
    ENGIVAULT_NORMAL_SHOCK_MACH = machNumber2
    Exit Function
    
ErrorHandler:
    ENGIVAULT_NORMAL_SHOCK_MACH = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_NORMAL_SHOCK_MACH: " & Err.Description
End Function

'===============================================================================
' FLOW REGIME VALIDATION
'===============================================================================

Public Function VALIDATE_OPEN_CHANNEL_FLOW( _
    froudeNumber As Double, _
    velocity As Double, _
    depth As Double _
) As String
    '
    ' Validate open channel flow parameters
    '
    ' Parameters:
    '   froudeNumber: Froude number
    '   velocity: Velocity in m/s
    '   depth: Flow depth in m
    '
    ' Returns: Validation result ("Excellent", "Good", "Acceptable", "Poor")
    '
    ' Example: =VALIDATE_OPEN_CHANNEL_FLOW(0.5, 2.0, 1.5)
    '
    On Error GoTo ErrorHandler
    
    Dim score As Integer
    score = 0
    
    ' Score Froude number (subcritical preferred for most applications)
    If froudeNumber > 0.1 And froudeNumber < 0.8 Then
        score = score + 3
    ElseIf froudeNumber < 1.2 Then
        score = score + 2
    ElseIf froudeNumber < 2# Then
        score = score + 1
    End If
    
    ' Score velocity (reasonable range)
    If velocity > 0.5 And velocity < 3# Then
        score = score + 2
    ElseIf velocity < 5# Then
        score = score + 1
    End If
    
    ' Score depth (practical range)
    If depth > 0.1 And depth < 5# Then
        score = score + 1
    End If
    
    ' Determine overall rating
    If score >= 5 Then
        VALIDATE_OPEN_CHANNEL_FLOW = "Excellent"
    ElseIf score >= 3 Then
        VALIDATE_OPEN_CHANNEL_FLOW = "Good"
    ElseIf score >= 1 Then
        VALIDATE_OPEN_CHANNEL_FLOW = "Acceptable"
    Else
        VALIDATE_OPEN_CHANNEL_FLOW = "Poor"
    End If
    
    Exit Function
    
ErrorHandler:
    VALIDATE_OPEN_CHANNEL_FLOW = "Error"
    Debug.Print "Error in VALIDATE_OPEN_CHANNEL_FLOW: " & Err.Description
End Function

Public Function VALIDATE_COMPRESSIBLE_FLOW( _
    machNumber As Double, _
    temperature As Double, _
    pressure As Double _
) As String
    '
    ' Validate compressible flow conditions
    '
    ' Parameters:
    '   machNumber: Mach number
    '   temperature: Temperature in K
    '   pressure: Pressure in Pa
    '
    ' Returns: Validation result with recommendations
    '
    ' Example: =VALIDATE_COMPRESSIBLE_FLOW(0.3, 288, 101325)
    '
    On Error GoTo ErrorHandler
    
    Dim result As String
    
    ' Check Mach number regime
    If machNumber < 0.3 Then
        result = "Incompressible (M<0.3) - Use incompressible methods"
    ElseIf machNumber < 1# Then
        result = "Subsonic (M<1) - Compressible effects significant"
    ElseIf Abs(machNumber - 1#) < 0.05 Then
        result = "Sonic (M≈1) - Critical flow conditions"
    ElseIf machNumber < 5# Then
        result = "Supersonic (M>1) - Shock waves possible"
    Else
        result = "Hypersonic (M>5) - High temperature effects"
    End If
    
    ' Add temperature warning
    If temperature > 1000 Then
        result = result & " - High temperature: consider real gas effects"
    End If
    
    ' Add pressure warning
    If pressure > 1000000 Then ' > 10 bar
        result = result & " - High pressure: consider real gas effects"
    End If
    
    VALIDATE_COMPRESSIBLE_FLOW = result
    Exit Function
    
ErrorHandler:
    VALIDATE_COMPRESSIBLE_FLOW = "Error"
    Debug.Print "Error in VALIDATE_COMPRESSIBLE_FLOW: " & Err.Description
End Function

'===============================================================================
' UTILITY FUNCTIONS
'===============================================================================

Public Function HYDRAULIC_DIAMETER( _
    area As Double, _
    wettedPerimeter As Double _
) As Double
    '
    ' Calculate hydraulic diameter
    '
    ' Parameters:
    '   area: Cross-sectional area in m²
    '   wettedPerimeter: Wetted perimeter in m
    '
    ' Returns: Hydraulic diameter in m
    '
    ' Example: =HYDRAULIC_DIAMETER(0.5, 3.0)
    '
    On Error GoTo ErrorHandler
    
    HYDRAULIC_DIAMETER = 4 * area / wettedPerimeter
    Exit Function
    
ErrorHandler:
    HYDRAULIC_DIAMETER = CVErr(xlErrValue)
    Debug.Print "Error in HYDRAULIC_DIAMETER: " & Err.Description
End Function

Public Function DYNAMIC_PRESSURE( _
    density As Double, _
    velocity As Double _
) As Double
    '
    ' Calculate dynamic pressure
    '
    ' Parameters:
    '   density: Fluid density in kg/m³
    '   velocity: Velocity in m/s
    '
    ' Returns: Dynamic pressure in Pa
    '
    ' Example: =DYNAMIC_PRESSURE(1.225, 20)
    '
    On Error GoTo ErrorHandler
    
    DYNAMIC_PRESSURE = 0.5 * density * velocity ^ 2
    Exit Function
    
ErrorHandler:
    DYNAMIC_PRESSURE = CVErr(xlErrValue)
    Debug.Print "Error in DYNAMIC_PRESSURE: " & Err.Description
End Function
