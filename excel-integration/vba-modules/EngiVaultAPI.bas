Attribute VB_Name = "EngiVaultAPI"
'===============================================================================
' EngiVault Excel Integration
' VBA Module for Engineering Calculations
'
' Version: 1.0.0
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
' UTILITY FUNCTIONS
'===============================================================================

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
    http.setRequestHeader "User-Agent", "EngiVault-Excel-VBA/1.0.0"
    
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

'===============================================================================
' INFORMATION FUNCTIONS
'===============================================================================

Public Function ENGIVAULT_VERSION() As String
    '
    ' Get EngiVault Excel integration version
    '
    ' Returns: Version string
    '
    ' Example: =ENGIVAULT_VERSION()
    '
    ENGIVAULT_VERSION = "1.0.0"
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
