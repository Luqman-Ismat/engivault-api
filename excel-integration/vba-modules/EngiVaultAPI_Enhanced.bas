Attribute VB_Name = "EngiVaultAPI_Enhanced"
'===============================================================================
' EngiVault Excel Integration - Enhanced with Formula Tab Support
' VBA Module for Engineering Calculations with Excel Function Wizard Integration
'
' Version: 1.1.0
' Author: Luqman Ismat
' Website: https://engivault.com
' API: https://engivault-api-production.up.railway.app
'===============================================================================

Option Explicit

' API Configuration
Private Const API_BASE_URL As String = "https://engivault-api-production.up.railway.app"
Private Const API_VERSION As String = "v1"

' Global variables for API authentication
Public EngiVaultAPIKey As String
Public EngiVaultJWTToken As String

'===============================================================================
' FUNCTION REGISTRATION FOR EXCEL FORMULA TAB
'===============================================================================

Public Sub RegisterEngiVaultFunctions()
    '
    ' Register all EngiVault functions with Excel for Formula Tab integration
    ' This makes functions appear in Insert Function dialog and Formula Tab
    '
    On Error Resume Next
    
    ' Register Hydraulic Functions Category
    Application.MacroOptions _
        Macro:="ENGIVAULT_PRESSURE_DROP", _
        Description:="Calculate pressure drop using Darcy-Weisbach equation", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pipe diameter in meters", _
            "Pipe length in meters", _
            "Fluid density in kg/m³", _
            "Fluid viscosity in Pa·s", _
            "Pipe roughness in meters (optional, default: 0.00015)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_FLOW_RATE", _
        Description:="Calculate flow rate from pressure drop", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Pressure drop in Pa", _
            "Pipe diameter in meters", _
            "Pipe length in meters", _
            "Fluid density in kg/m³", _
            "Fluid viscosity in Pa·s", _
            "Pipe roughness in meters (optional, default: 0.00015)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_REYNOLDS_NUMBER", _
        Description:="Calculate Reynolds number for pipe flow", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pipe diameter in meters", _
            "Fluid density in kg/m³", _
            "Fluid viscosity in Pa·s" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_PIPE_VELOCITY", _
        Description:="Calculate fluid velocity in pipe", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pipe diameter in meters" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_PIPE_AREA", _
        Description:="Calculate pipe cross-sectional area", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Pipe diameter in meters" _
        )
    
    ' Register Pump Functions Category
    Application.MacroOptions _
        Macro:="ENGIVAULT_PUMP_POWER", _
        Description:="Calculate pump hydraulic power", _
        Category:="EngiVault Pumps", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pump head in meters", _
            "Pump efficiency (0-1)", _
            "Pump power in watts" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_NPSH_AVAILABLE", _
        Description:="Calculate Net Positive Suction Head Available", _
        Category:="EngiVault Pumps", _
        ArgumentDescriptions:=Array( _
            "Suction pressure in Pa", _
            "Vapor pressure in Pa", _
            "Fluid density in kg/m³", _
            "Suction velocity in m/s", _
            "Suction losses in meters" _
        )
    
    ' Register Fluid Properties Category
    Application.MacroOptions _
        Macro:="WATER_DENSITY", _
        Description:="Get water density at given temperature", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="WATER_VISCOSITY", _
        Description:="Get water dynamic viscosity at given temperature", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="WATER_VAPOR_PRESSURE", _
        Description:="Get water vapor pressure at given temperature", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (1-100°C)" _
        )
    
    ' Register Unit Conversion Category
    Application.MacroOptions _
        Macro:="CONVERT_FLOW_RATE", _
        Description:="Convert flow rate between different units", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Flow rate value", _
            "Source unit (m3/s, m3/h, l/s, l/min, gpm, cfm)", _
            "Target unit (m3/s, m3/h, l/s, l/min, gpm, cfm)" _
        )
    
    Application.MacroOptions _
        Macro:="CONVERT_PRESSURE", _
        Description:="Convert pressure between different units", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Pressure value", _
            "Source unit (Pa, kPa, bar, psi, atm, mmHg)", _
            "Target unit (Pa, kPa, bar, psi, atm, mmHg)" _
        )
    
    Application.MacroOptions _
        Macro:="CONVERT_LENGTH", _
        Description:="Convert length between different units", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Length value", _
            "Source unit (m, cm, mm, in, ft)", _
            "Target unit (m, cm, mm, in, ft)" _
        )
    
    ' Register Engineering Tools Category
    Application.MacroOptions _
        Macro:="PIPE_SIZE_RECOMMENDATION", _
        Description:="Recommend minimum pipe diameter based on flow rate and maximum velocity", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Maximum allowable velocity in m/s", _
            "Output unit (m, mm, in) - optional, default: m" _
        )
    
    Application.MacroOptions _
        Macro:="STANDARD_PIPE_SIZE", _
        Description:="Get next larger standard pipe size", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Calculated diameter", _
            "Input/output unit (m, mm, in) - optional, default: m", _
            "Pipe standard (ANSI, ISO) - optional, default: ANSI" _
        )
    
    Application.MacroOptions _
        Macro:="VALIDATE_FLOW_REGIME", _
        Description:="Determine flow regime based on Reynolds number", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Reynolds number" _
        )
    
    Application.MacroOptions _
        Macro:="VALIDATE_VELOCITY", _
        Description:="Check if velocity is within recommended ranges", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Velocity in m/s", _
            "Application type (water, steam, gas, oil)" _
        )
    
    ' Register System Functions Category
    Application.MacroOptions _
        Macro:="ENGIVAULT_VERSION", _
        Description:="Get EngiVault Excel integration version", _
        Category:="EngiVault System"
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_API_STATUS", _
        Description:="Check EngiVault API status", _
        Category:="EngiVault System"
    
    MsgBox "EngiVault functions registered successfully!" & vbCrLf & _
           "You can now find them in:" & vbCrLf & _
           "• Insert Function dialog (fx button)" & vbCrLf & _
           "• Formulas tab > Insert Function" & vbCrLf & _
           "• Function categories: EngiVault Hydraulics, EngiVault Pumps, etc.", _
           vbInformation, "EngiVault Registration Complete"
    
End Sub

'===============================================================================
' AUTO-REGISTRATION ON WORKBOOK OPEN
'===============================================================================

Private Sub Workbook_Open()
    '
    ' Automatically register functions when workbook opens
    ' This ensures functions are always available in Formula Tab
    '
    Call RegisterEngiVaultFunctions
End Sub

'===============================================================================
' CONFIGURATION FUNCTIONS
'===============================================================================

Public Sub SetEngiVaultAPIKey(apiKey As String)
    '
    ' Set your EngiVault API key for authentication
    '
    ' Usage: Call SetEngiVaultAPIKey("your-api-key-here")
    '
    EngiVaultAPIKey = apiKey
    MsgBox "EngiVault API Key has been set successfully!", vbInformation, "EngiVault"
End Sub

Public Sub SetEngiVaultJWTToken(jwtToken As String)
    '
    ' Set your EngiVault JWT token for authentication
    '
    ' Usage: Call SetEngiVaultJWTToken("your-jwt-token-here")
    '
    EngiVaultJWTToken = jwtToken
    MsgBox "EngiVault JWT Token has been set successfully!", vbInformation, "EngiVault"
End Sub

'===============================================================================
' HYDRAULICS CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_PRESSURE_DROP( _
    flowRate As Double, _
    pipeDiameter As Double, _
    pipeLength As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double, _
    Optional pipeRoughness As Double = 0.00015 _
) As Double
    '
    ' Calculate pressure drop using Darcy-Weisbach equation
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   pipeDiameter: Pipe diameter in meters
    '   pipeLength: Pipe length in meters
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '   pipeRoughness: Pipe roughness in meters (optional, default: 0.00015)
    '
    ' Returns: Pressure drop in Pa
    '
    ' Example: =ENGIVAULT_PRESSURE_DROP(0.1, 0.1, 100, 1000, 0.001)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim pressureDrop As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """pipeDiameter"": " & pipeDiameter & ", " & _
        """pipeLength"": " & pipeLength & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """fluidViscosity"": " & fluidViscosity & ", " & _
        """pipeRoughness"": " & pipeRoughness & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/" & API_VERSION & "/hydraulics/pressure-drop", requestBody)
    
    ' Parse response and extract pressure drop
    pressureDrop = ParseNumericResponse(response, "pressureDrop")
    
    ENGIVAULT_PRESSURE_DROP = pressureDrop
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PRESSURE_DROP = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PRESSURE_DROP: " & Err.Description
End Function

Public Function ENGIVAULT_FLOW_RATE( _
    pressureDrop As Double, _
    pipeDiameter As Double, _
    pipeLength As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double, _
    Optional pipeRoughness As Double = 0.00015 _
) As Double
    '
    ' Calculate flow rate from pressure drop
    '
    ' Parameters:
    '   pressureDrop: Pressure drop in Pa
    '   pipeDiameter: Pipe diameter in meters
    '   pipeLength: Pipe length in meters
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '   pipeRoughness: Pipe roughness in meters (optional, default: 0.00015)
    '
    ' Returns: Flow rate in m³/s
    '
    ' Example: =ENGIVAULT_FLOW_RATE(10000, 0.1, 100, 1000, 0.001)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim flowRate As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """pressureDrop"": " & pressureDrop & ", " & _
        """pipeDiameter"": " & pipeDiameter & ", " & _
        """pipeLength"": " & pipeLength & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """fluidViscosity"": " & fluidViscosity & ", " & _
        """pipeRoughness"": " & pipeRoughness & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/" & API_VERSION & "/hydraulics/flow-rate", requestBody)
    
    ' Parse response and extract flow rate
    flowRate = ParseNumericResponse(response, "flowRate")
    
    ENGIVAULT_FLOW_RATE = flowRate
    Exit Function
    
ErrorHandler:
    ENGIVAULT_FLOW_RATE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_FLOW_RATE: " & Err.Description
End Function

Public Function ENGIVAULT_REYNOLDS_NUMBER( _
    flowRate As Double, _
    pipeDiameter As Double, _
    fluidDensity As Double, _
    fluidViscosity As Double _
) As Double
    '
    ' Calculate Reynolds number for pipe flow
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   pipeDiameter: Pipe diameter in meters
    '   fluidDensity: Fluid density in kg/m³
    '   fluidViscosity: Fluid viscosity in Pa·s
    '
    ' Returns: Reynolds number (dimensionless)
    '
    ' Example: =ENGIVAULT_REYNOLDS_NUMBER(0.1, 0.1, 1000, 0.001)
    '
    
    On Error GoTo ErrorHandler
    
    Dim pipeArea As Double
    Dim velocity As Double
    Dim reynoldsNumber As Double
    
    ' Calculate pipe area
    pipeArea = Application.WorksheetFunction.Pi * (pipeDiameter / 2) ^ 2
    
    ' Calculate velocity
    velocity = flowRate / pipeArea
    
    ' Calculate Reynolds number
    reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity
    
    ENGIVAULT_REYNOLDS_NUMBER = reynoldsNumber
    Exit Function
    
ErrorHandler:
    ENGIVAULT_REYNOLDS_NUMBER = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_REYNOLDS_NUMBER: " & Err.Description
End Function

Public Function ENGIVAULT_PIPE_VELOCITY( _
    flowRate As Double, _
    pipeDiameter As Double _
) As Double
    '
    ' Calculate fluid velocity in pipe
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   pipeDiameter: Pipe diameter in meters
    '
    ' Returns: Velocity in m/s
    '
    ' Example: =ENGIVAULT_PIPE_VELOCITY(0.1, 0.1)
    '
    
    On Error GoTo ErrorHandler
    
    Dim pipeArea As Double
    Dim velocity As Double
    
    ' Calculate pipe area
    pipeArea = Application.WorksheetFunction.Pi * (pipeDiameter / 2) ^ 2
    
    ' Calculate velocity
    velocity = flowRate / pipeArea
    
    ENGIVAULT_PIPE_VELOCITY = velocity
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PIPE_VELOCITY = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PIPE_VELOCITY: " & Err.Description
End Function

Public Function ENGIVAULT_PIPE_AREA( _
    pipeDiameter As Double _
) As Double
    '
    ' Calculate pipe cross-sectional area
    '
    ' Parameters:
    '   pipeDiameter: Pipe diameter in meters
    '
    ' Returns: Area in m²
    '
    ' Example: =ENGIVAULT_PIPE_AREA(0.1)
    '
    
    On Error GoTo ErrorHandler
    
    Dim pipeArea As Double
    
    ' Calculate pipe area
    pipeArea = Application.WorksheetFunction.Pi * (pipeDiameter / 2) ^ 2
    
    ENGIVAULT_PIPE_AREA = pipeArea
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PIPE_AREA = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PIPE_AREA: " & Err.Description
End Function

'===============================================================================
' PUMP CALCULATIONS
'===============================================================================

Public Function ENGIVAULT_PUMP_POWER( _
    flowRate As Double, _
    head As Double, _
    efficiency As Double, _
    power As Double _
) As Double
    '
    ' Calculate pump hydraulic power
    '
    ' Parameters:
    '   flowRate: Flow rate in m³/s
    '   head: Pump head in meters
    '   efficiency: Pump efficiency (0-1)
    '   power: Pump power in watts
    '
    ' Returns: Hydraulic power in kW
    '
    ' Example: =ENGIVAULT_PUMP_POWER(0.05, 50, 0.8, 5000)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim hydraulicPower As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """flowRate"": " & flowRate & ", " & _
        """head"": " & head & ", " & _
        """efficiency"": " & efficiency & ", " & _
        """power"": " & power & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/" & API_VERSION & "/pumps/performance", requestBody)
    
    ' Parse response and extract hydraulic power
    hydraulicPower = ParseNumericResponse(response, "hydraulicPower")
    
    ENGIVAULT_PUMP_POWER = hydraulicPower
    Exit Function
    
ErrorHandler:
    ENGIVAULT_PUMP_POWER = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_PUMP_POWER: " & Err.Description
End Function

Public Function ENGIVAULT_NPSH_AVAILABLE( _
    suctionPressure As Double, _
    vaporPressure As Double, _
    fluidDensity As Double, _
    suctionVelocity As Double, _
    suctionLosses As Double _
) As Double
    '
    ' Calculate Net Positive Suction Head Available
    '
    ' Parameters:
    '   suctionPressure: Suction pressure in Pa
    '   vaporPressure: Vapor pressure in Pa
    '   fluidDensity: Fluid density in kg/m³
    '   suctionVelocity: Suction velocity in m/s
    '   suctionLosses: Suction losses in meters
    '
    ' Returns: NPSH Available in meters
    '
    ' Example: =ENGIVAULT_NPSH_AVAILABLE(101325, 2337, 1000, 2.0, 1.5)
    '
    
    On Error GoTo ErrorHandler
    
    Dim requestBody As String
    Dim response As String
    Dim npshAvailable As Double
    
    ' Build JSON request body
    requestBody = "{" & _
        """suctionPressure"": " & suctionPressure & ", " & _
        """vaporPressure"": " & vaporPressure & ", " & _
        """fluidDensity"": " & fluidDensity & ", " & _
        """suctionVelocity"": " & suctionVelocity & ", " & _
        """suctionLosses"": " & suctionLosses & _
        "}"
    
    ' Make API request
    response = MakeAPIRequest("POST", "/api/" & API_VERSION & "/pumps/npsh", requestBody)
    
    ' Parse response and extract NPSH available
    npshAvailable = ParseNumericResponse(response, "npshAvailable")
    
    ENGIVAULT_NPSH_AVAILABLE = npshAvailable
    Exit Function
    
ErrorHandler:
    ENGIVAULT_NPSH_AVAILABLE = CVErr(xlErrValue)
    Debug.Print "Error in ENGIVAULT_NPSH_AVAILABLE: " & Err.Description
End Function

'===============================================================================
' SYSTEM FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_VERSION() As String
    '
    ' Get EngiVault Excel integration version
    '
    ' Returns: Version string
    '
    ' Example: =ENGIVAULT_VERSION()
    '
    ENGIVAULT_VERSION = "1.1.0"
End Function

Public Function ENGIVAULT_API_STATUS() As String
    '
    ' Check EngiVault API status
    '
    ' Returns: API status
    '
    ' Example: =ENGIVAULT_API_STATUS()
    '
    On Error GoTo ErrorHandler
    
    Dim response As String
    
    ' Make health check request
    response = MakeAPIRequest("GET", "/health", "")
    
    ' Simple check if response contains success indicators
    If InStr(response, """status"":""ok""") > 0 Or InStr(response, "success") > 0 Then
        ENGIVAULT_API_STATUS = "Online"
    Else
        ENGIVAULT_API_STATUS = "Unknown"
    End If
    
    Exit Function
    
ErrorHandler:
    ENGIVAULT_API_STATUS = "Offline"
    Debug.Print "Error in ENGIVAULT_API_STATUS: " & Err.Description
End Function

'===============================================================================
' INTERNAL HELPER FUNCTIONS
'===============================================================================

Private Function MakeAPIRequest(method As String, endpoint As String, Optional requestBody As String = "") As String
    '
    ' Make HTTP request to EngiVault API
    '
    On Error GoTo ErrorHandler
    
    Dim http As Object
    Dim url As String
    Dim authHeader As String
    
    ' Create HTTP object
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' Build URL
    url = API_BASE_URL & endpoint
    
    ' Open request
    http.Open method, url, False
    
    ' Set headers
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "User-Agent", "EngiVault-Excel-VBA/1.1.0"
    
    ' Set authentication header
    If EngiVaultJWTToken <> "" Then
        http.setRequestHeader "Authorization", "Bearer " & EngiVaultJWTToken
    ElseIf EngiVaultAPIKey <> "" Then
        http.setRequestHeader "X-API-Key", EngiVaultAPIKey
    Else
        Err.Raise vbObjectError + 1001, "EngiVault", "No API key or JWT token set. Use SetEngiVaultAPIKey() or SetEngiVaultJWTToken() first."
    End If
    
    ' Send request
    If requestBody <> "" Then
        http.send requestBody
    Else
        http.send
    End If
    
    ' Check response status
    If http.Status >= 200 And http.Status < 300 Then
        MakeAPIRequest = http.responseText
    Else
        Err.Raise vbObjectError + 1002, "EngiVault", "API request failed with status " & http.Status & ": " & http.responseText
    End If
    
    Exit Function
    
ErrorHandler:
    MakeAPIRequest = ""
    Debug.Print "Error in MakeAPIRequest: " & Err.Description
    Err.Raise Err.Number, Err.Source, Err.Description
End Function

Private Function ParseNumericResponse(jsonResponse As String, fieldName As String) As Double
    '
    ' Parse numeric value from JSON response
    '
    On Error GoTo ErrorHandler
    
    Dim startPos As Long
    Dim endPos As Long
    Dim valueStr As String
    Dim searchStr As String
    
    ' Look for the field in the data object
    searchStr = """" & fieldName & """:"
    startPos = InStr(jsonResponse, searchStr)
    
    If startPos = 0 Then
        Err.Raise vbObjectError + 1003, "EngiVault", "Field '" & fieldName & "' not found in API response"
    End If
    
    ' Find the start of the value
    startPos = startPos + Len(searchStr)
    
    ' Skip whitespace
    Do While Mid(jsonResponse, startPos, 1) = " "
        startPos = startPos + 1
    Loop
    
    ' Find the end of the value (comma, closing brace, or end of string)
    endPos = startPos
    Do While endPos <= Len(jsonResponse)
        Dim char As String
        char = Mid(jsonResponse, endPos, 1)
        If char = "," Or char = "}" Or char = "]" Then
            Exit Do
        End If
        endPos = endPos + 1
    Loop
    
    ' Extract the value
    valueStr = Mid(jsonResponse, startPos, endPos - startPos)
    
    ' Convert to double
    ParseNumericResponse = CDbl(valueStr)
    Exit Function
    
ErrorHandler:
    ParseNumericResponse = 0
    Debug.Print "Error in ParseNumericResponse: " & Err.Description
    Err.Raise Err.Number, Err.Source, Err.Description
End Function
