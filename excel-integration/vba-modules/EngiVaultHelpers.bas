Attribute VB_Name = "EngiVaultHelpers"
'===============================================================================
' EngiVault Excel Integration - Helper Functions
' Advanced calculations and utility functions
'
' Version: 1.0.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' FLUID PROPERTIES
'===============================================================================

Public Function WATER_DENSITY(temperature As Double) As Double
    '
    ' Get water density at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius
    '
    ' Returns: Density in kg/m³
    '
    ' Example: =WATER_DENSITY(20)
    '
    On Error GoTo ErrorHandler
    
    ' Simplified density calculation for water (valid 0-100°C)
    If temperature < 0 Or temperature > 100 Then
        Err.Raise vbObjectError + 2001, "EngiVault", "Temperature must be between 0 and 100°C"
    End If
    
    ' Polynomial approximation for water density
    WATER_DENSITY = 1000.0 - 0.0178 * temperature - 0.0058 * temperature ^ 2
    Exit Function
    
ErrorHandler:
    WATER_DENSITY = CVErr(xlErrValue)
    Debug.Print "Error in WATER_DENSITY: " & Err.Description
End Function

Public Function WATER_VISCOSITY(temperature As Double) As Double
    '
    ' Get water dynamic viscosity at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius
    '
    ' Returns: Dynamic viscosity in Pa·s
    '
    ' Example: =WATER_VISCOSITY(20)
    '
    On Error GoTo ErrorHandler
    
    ' Simplified viscosity calculation for water (valid 0-100°C)
    If temperature < 0 Or temperature > 100 Then
        Err.Raise vbObjectError + 2002, "EngiVault", "Temperature must be between 0 and 100°C"
    End If
    
    ' Polynomial approximation for water viscosity
    Dim viscosity As Double
    viscosity = 0.001792 * Exp(-0.0255 * temperature)
    
    WATER_VISCOSITY = viscosity
    Exit Function
    
ErrorHandler:
    WATER_VISCOSITY = CVErr(xlErrValue)
    Debug.Print "Error in WATER_VISCOSITY: " & Err.Description
End Function

Public Function WATER_VAPOR_PRESSURE(temperature As Double) As Double
    '
    ' Get water vapor pressure at given temperature
    '
    ' Parameters:
    '   temperature: Temperature in Celsius
    '
    ' Returns: Vapor pressure in Pa
    '
    ' Example: =WATER_VAPOR_PRESSURE(20)
    '
    On Error GoTo ErrorHandler
    
    ' Antoine equation for water vapor pressure (valid 1-100°C)
    If temperature < 1 Or temperature > 100 Then
        Err.Raise vbObjectError + 2003, "EngiVault", "Temperature must be between 1 and 100°C"
    End If
    
    Dim a As Double, b As Double, c As Double
    Dim logP As Double
    
    ' Antoine constants for water
    a = 8.07131
    b = 1730.63
    c = 233.426
    
    ' Calculate log10(P) where P is in mmHg
    logP = a - b / (temperature + c)
    
    ' Convert from mmHg to Pa
    WATER_VAPOR_PRESSURE = (10 ^ logP) * 133.322
    Exit Function
    
ErrorHandler:
    WATER_VAPOR_PRESSURE = CVErr(xlErrValue)
    Debug.Print "Error in WATER_VAPOR_PRESSURE: " & Err.Description
End Function

'===============================================================================
' UNIT CONVERSIONS
'===============================================================================

Public Function CONVERT_FLOW_RATE(value As Double, fromUnit As String, toUnit As String) As Double
    '
    ' Convert flow rate between different units
    '
    ' Parameters:
    '   value: Flow rate value
    '   fromUnit: Source unit (m3/s, m3/h, l/s, l/min, gpm, cfm)
    '   toUnit: Target unit (m3/s, m3/h, l/s, l/min, gpm, cfm)
    '
    ' Returns: Converted flow rate
    '
    ' Example: =CONVERT_FLOW_RATE(100, "gpm", "m3/s")
    '
    On Error GoTo ErrorHandler
    
    Dim valueInM3S As Double
    Dim result As Double
    
    ' Convert input to m³/s first
    Select Case LCase(fromUnit)
        Case "m3/s", "m³/s"
            valueInM3S = value
        Case "m3/h", "m³/h"
            valueInM3S = value / 3600
        Case "l/s"
            valueInM3S = value / 1000
        Case "l/min"
            valueInM3S = value / 60000
        Case "gpm"
            valueInM3S = value * 0.00006309
        Case "cfm"
            valueInM3S = value * 0.0004719
        Case Else
            Err.Raise vbObjectError + 2004, "EngiVault", "Unknown flow rate unit: " & fromUnit
    End Select
    
    ' Convert from m³/s to target unit
    Select Case LCase(toUnit)
        Case "m3/s", "m³/s"
            result = valueInM3S
        Case "m3/h", "m³/h"
            result = valueInM3S * 3600
        Case "l/s"
            result = valueInM3S * 1000
        Case "l/min"
            result = valueInM3S * 60000
        Case "gpm"
            result = valueInM3S / 0.00006309
        Case "cfm"
            result = valueInM3S / 0.0004719
        Case Else
            Err.Raise vbObjectError + 2005, "EngiVault", "Unknown flow rate unit: " & toUnit
    End Select
    
    CONVERT_FLOW_RATE = result
    Exit Function
    
ErrorHandler:
    CONVERT_FLOW_RATE = CVErr(xlErrValue)
    Debug.Print "Error in CONVERT_FLOW_RATE: " & Err.Description
End Function

Public Function CONVERT_PRESSURE(value As Double, fromUnit As String, toUnit As String) As Double
    '
    ' Convert pressure between different units
    '
    ' Parameters:
    '   value: Pressure value
    '   fromUnit: Source unit (Pa, kPa, bar, psi, atm, mmHg)
    '   toUnit: Target unit (Pa, kPa, bar, psi, atm, mmHg)
    '
    ' Returns: Converted pressure
    '
    ' Example: =CONVERT_PRESSURE(14.7, "psi", "Pa")
    '
    On Error GoTo ErrorHandler
    
    Dim valueInPa As Double
    Dim result As Double
    
    ' Convert input to Pa first
    Select Case LCase(fromUnit)
        Case "pa"
            valueInPa = value
        Case "kpa"
            valueInPa = value * 1000
        Case "bar"
            valueInPa = value * 100000
        Case "psi"
            valueInPa = value * 6894.76
        Case "atm"
            valueInPa = value * 101325
        Case "mmhg"
            valueInPa = value * 133.322
        Case Else
            Err.Raise vbObjectError + 2006, "EngiVault", "Unknown pressure unit: " & fromUnit
    End Select
    
    ' Convert from Pa to target unit
    Select Case LCase(toUnit)
        Case "pa"
            result = valueInPa
        Case "kpa"
            result = valueInPa / 1000
        Case "bar"
            result = valueInPa / 100000
        Case "psi"
            result = valueInPa / 6894.76
        Case "atm"
            result = valueInPa / 101325
        Case "mmhg"
            result = valueInPa / 133.322
        Case Else
            Err.Raise vbObjectError + 2007, "EngiVault", "Unknown pressure unit: " & toUnit
    End Select
    
    CONVERT_PRESSURE = result
    Exit Function
    
ErrorHandler:
    CONVERT_PRESSURE = CVErr(xlErrValue)
    Debug.Print "Error in CONVERT_PRESSURE: " & Err.Description
End Function

Public Function CONVERT_LENGTH(value As Double, fromUnit As String, toUnit As String) As Double
    '
    ' Convert length between different units
    '
    ' Parameters:
    '   value: Length value
    '   fromUnit: Source unit (m, cm, mm, in, ft)
    '   toUnit: Target unit (m, cm, mm, in, ft)
    '
    ' Returns: Converted length
    '
    ' Example: =CONVERT_LENGTH(4, "in", "m")
    '
    On Error GoTo ErrorHandler
    
    Dim valueInM As Double
    Dim result As Double
    
    ' Convert input to meters first
    Select Case LCase(fromUnit)
        Case "m"
            valueInM = value
        Case "cm"
            valueInM = value / 100
        Case "mm"
            valueInM = value / 1000
        Case "in"
            valueInM = value * 0.0254
        Case "ft"
            valueInM = value * 0.3048
        Case Else
            Err.Raise vbObjectError + 2008, "EngiVault", "Unknown length unit: " & fromUnit
    End Select
    
    ' Convert from meters to target unit
    Select Case LCase(toUnit)
        Case "m"
            result = valueInM
        Case "cm"
            result = valueInM * 100
        Case "mm"
            result = valueInM * 1000
        Case "in"
            result = valueInM / 0.0254
        Case "ft"
            result = valueInM / 0.3048
        Case Else
            Err.Raise vbObjectError + 2009, "EngiVault", "Unknown length unit: " & toUnit
    End Select
    
    CONVERT_LENGTH = result
    Exit Function
    
ErrorHandler:
    CONVERT_LENGTH = CVErr(xlErrValue)
    Debug.Print "Error in CONVERT_LENGTH: " & Err.Description
End Function

'===============================================================================
' PIPE SIZING HELPERS
'===============================================================================

Public Function PIPE_SIZE_RECOMMENDATION( _
    flowRate As Double, _
    maxVelocity As Double, _
    Optional unit As String = "m" _
) As Double
    '
    ' Recommend minimum pipe diameter based on flow rate and maximum velocity
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   maxVelocity: Maximum allowable velocity in m/s
    '   unit: Output unit (m, mm, in) - default: m
    '
    ' Returns: Minimum pipe diameter
    '
    ' Example: =PIPE_SIZE_RECOMMENDATION(0.1, 3.0, "mm")
    '
    On Error GoTo ErrorHandler
    
    Dim minArea As Double
    Dim minDiameter As Double
    Dim result As Double
    
    ' Calculate minimum required area
    minArea = flowRate / maxVelocity
    
    ' Calculate minimum diameter from area
    minDiameter = Sqr(4 * minArea / Application.WorksheetFunction.Pi)
    
    ' Convert to requested unit
    Select Case LCase(unit)
        Case "m"
            result = minDiameter
        Case "mm"
            result = minDiameter * 1000
        Case "in"
            result = minDiameter / 0.0254
        Case Else
            Err.Raise vbObjectError + 2010, "EngiVault", "Unknown unit: " & unit
    End Select
    
    PIPE_SIZE_RECOMMENDATION = result
    Exit Function
    
ErrorHandler:
    PIPE_SIZE_RECOMMENDATION = CVErr(xlErrValue)
    Debug.Print "Error in PIPE_SIZE_RECOMMENDATION: " & Err.Description
End Function

Public Function STANDARD_PIPE_SIZE( _
    calculatedDiameter As Double, _
    Optional unit As String = "m", _
    Optional standard As String = "ANSI" _
) As Double
    '
    ' Get next larger standard pipe size
    '
    ' Parameters:
    '   calculatedDiameter: Calculated diameter
    '   unit: Input/output unit (m, mm, in) - default: m
    '   standard: Pipe standard (ANSI, ISO) - default: ANSI
    '
    ' Returns: Standard pipe diameter
    '
    ' Example: =STANDARD_PIPE_SIZE(0.095, "m", "ANSI")
    '
    On Error GoTo ErrorHandler
    
    Dim diameterInMm As Double
    Dim standardSizes As Variant
    Dim i As Integer
    Dim result As Double
    
    ' Convert input to mm
    Select Case LCase(unit)
        Case "m"
            diameterInMm = calculatedDiameter * 1000
        Case "mm"
            diameterInMm = calculatedDiameter
        Case "in"
            diameterInMm = calculatedDiameter * 25.4
        Case Else
            Err.Raise vbObjectError + 2011, "EngiVault", "Unknown unit: " & unit
    End Select
    
    ' Define standard sizes in mm
    If UCase(standard) = "ANSI" Then
        standardSizes = Array(15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600)
    Else ' ISO
        standardSizes = Array(15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800)
    End If
    
    ' Find next larger standard size
    result = standardSizes(UBound(standardSizes)) ' Default to largest if none found
    For i = LBound(standardSizes) To UBound(standardSizes)
        If standardSizes(i) >= diameterInMm Then
            result = standardSizes(i)
            Exit For
        End If
    Next i
    
    ' Convert back to requested unit
    Select Case LCase(unit)
        Case "m"
            result = result / 1000
        Case "mm"
            ' Already in mm
        Case "in"
            result = result / 25.4
    End Select
    
    STANDARD_PIPE_SIZE = result
    Exit Function
    
ErrorHandler:
    STANDARD_PIPE_SIZE = CVErr(xlErrValue)
    Debug.Print "Error in STANDARD_PIPE_SIZE: " & Err.Description
End Function

'===============================================================================
' VALIDATION HELPERS
'===============================================================================

Public Function VALIDATE_FLOW_REGIME(reynoldsNumber As Double) As String
    '
    ' Determine flow regime based on Reynolds number
    '
    ' Parameters:
    '   reynoldsNumber: Reynolds number
    '
    ' Returns: Flow regime (Laminar, Transitional, Turbulent)
    '
    ' Example: =VALIDATE_FLOW_REGIME(50000)
    '
    On Error GoTo ErrorHandler
    
    If reynoldsNumber < 2300 Then
        VALIDATE_FLOW_REGIME = "Laminar"
    ElseIf reynoldsNumber < 4000 Then
        VALIDATE_FLOW_REGIME = "Transitional"
    Else
        VALIDATE_FLOW_REGIME = "Turbulent"
    End If
    
    Exit Function
    
ErrorHandler:
    VALIDATE_FLOW_REGIME = "Error"
    Debug.Print "Error in VALIDATE_FLOW_REGIME: " & Err.Description
End Function

Public Function VALIDATE_VELOCITY(velocity As Double, application As String) As String
    '
    ' Check if velocity is within recommended ranges
    '
    ' Parameters:
    '   velocity: Velocity in m/s
    '   application: Application type (water, steam, gas, oil)
    '
    ' Returns: Validation result (OK, High, Low)
    '
    ' Example: =VALIDATE_VELOCITY(2.5, "water")
    '
    On Error GoTo ErrorHandler
    
    Dim minVel As Double, maxVel As Double
    
    Select Case LCase(application)
        Case "water"
            minVel = 0.9
            maxVel = 3.0
        Case "steam"
            minVel = 15
            maxVel = 60
        Case "gas"
            minVel = 10
            maxVel = 30
        Case "oil"
            minVel = 0.6
            maxVel = 2.0
        Case Else
            VALIDATE_VELOCITY = "Unknown Application"
            Exit Function
    End Select
    
    If velocity < minVel Then
        VALIDATE_VELOCITY = "Low"
    ElseIf velocity > maxVel Then
        VALIDATE_VELOCITY = "High"
    Else
        VALIDATE_VELOCITY = "OK"
    End If
    
    Exit Function
    
ErrorHandler:
    VALIDATE_VELOCITY = "Error"
    Debug.Print "Error in VALIDATE_VELOCITY: " & Err.Description
End Function
