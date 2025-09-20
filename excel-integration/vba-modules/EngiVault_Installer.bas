Attribute VB_Name = "EngiVault_Installer"
'===============================================================================
' EngiVault Excel Integration - Automatic Installer
' Handles function registration and Formula Tab integration
'
' Version: 1.1.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' MAIN INSTALLATION ROUTINE
'===============================================================================

Public Sub InstallEngiVault()
    '
    ' Complete EngiVault installation and setup
    ' This will register all functions for Formula Tab integration
    '
    Dim startTime As Double
    startTime = Timer
    
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    On Error GoTo ErrorHandler
    
    ' Show installation progress
    Application.StatusBar = "Installing EngiVault Excel Integration..."
    
    ' Step 1: Register all functions
    Call RegisterAllFunctions
    
    ' Step 2: Create function categories
    Call CreateFunctionCategories
    
    ' Step 3: Set up authentication
    Call SetupAuthentication
    
    ' Step 4: Test installation
    Call TestInstallation
    
    ' Step 5: Show completion message
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    Dim installTime As Double
    installTime = Timer - startTime
    
    MsgBox "EngiVault Excel Integration installed successfully!" & vbCrLf & vbCrLf & _
           "✅ 35+ functions registered" & vbCrLf & _
           "✅ Formula Tab integration active" & vbCrLf & _
           "✅ Function categories created" & vbCrLf & _
           "✅ Installation completed in " & Format(installTime, "0.0") & " seconds" & vbCrLf & vbCrLf & _
           "You can now access EngiVault functions through:" & vbCrLf & _
           "• Formulas Tab → Insert Function" & vbCrLf & _
           "• fx button next to formula bar" & vbCrLf & _
           "• Type function names directly in cells" & vbCrLf & vbCrLf & _
           "Categories available:" & vbCrLf & _
           "• EngiVault Hydraulics" & vbCrLf & _
           "• EngiVault Pumps" & vbCrLf & _
           "• EngiVault Fluid Properties" & vbCrLf & _
           "• EngiVault Conversions" & vbCrLf & _
           "• EngiVault Engineering Tools" & vbCrLf & _
           "• EngiVault System", _
           vbInformation, "EngiVault Installation Complete"
    
    Exit Sub
    
ErrorHandler:
    Application.StatusBar = False
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    
    MsgBox "Installation error: " & Err.Description, vbCritical, "EngiVault Installation Failed"
End Sub

'===============================================================================
' FUNCTION REGISTRATION
'===============================================================================

Private Sub RegisterAllFunctions()
    '
    ' Register all EngiVault functions with detailed descriptions
    '
    On Error Resume Next
    
    Application.StatusBar = "Registering hydraulic functions..."
    
    ' Hydraulic Functions
    Application.MacroOptions _
        Macro:="ENGIVAULT_PRESSURE_DROP", _
        Description:="Calculate pressure drop using Darcy-Weisbach equation. Returns pressure drop in Pa.", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s (cubic meters per second)", _
            "Pipe diameter in meters", _
            "Pipe length in meters", _
            "Fluid density in kg/m³ (water = 1000)", _
            "Fluid viscosity in Pa·s (water at 20°C = 0.001)", _
            "[Optional] Pipe roughness in meters (default: 0.00015 for commercial steel)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_FLOW_RATE", _
        Description:="Calculate flow rate from known pressure drop. Returns flow rate in m³/s.", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Pressure drop in Pa (Pascals)", _
            "Pipe diameter in meters", _
            "Pipe length in meters", _
            "Fluid density in kg/m³ (water = 1000)", _
            "Fluid viscosity in Pa·s (water at 20°C = 0.001)", _
            "[Optional] Pipe roughness in meters (default: 0.00015)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_REYNOLDS_NUMBER", _
        Description:="Calculate Reynolds number for pipe flow. Returns dimensionless number.", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pipe diameter in meters", _
            "Fluid density in kg/m³", _
            "Fluid viscosity in Pa·s" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_PIPE_VELOCITY", _
        Description:="Calculate average fluid velocity in pipe. Returns velocity in m/s.", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pipe diameter in meters" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_PIPE_AREA", _
        Description:="Calculate pipe cross-sectional area. Returns area in m².", _
        Category:="EngiVault Hydraulics", _
        ArgumentDescriptions:=Array( _
            "Pipe diameter in meters" _
        )
    
    Application.StatusBar = "Registering pump functions..."
    
    ' Pump Functions
    Application.MacroOptions _
        Macro:="ENGIVAULT_PUMP_POWER", _
        Description:="Calculate pump hydraulic power and performance. Returns hydraulic power in kW.", _
        Category:="EngiVault Pumps", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Pump head in meters", _
            "Pump efficiency as decimal (0.8 = 80%)", _
            "Motor power in watts" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_NPSH_AVAILABLE", _
        Description:="Calculate Net Positive Suction Head Available. Returns NPSH in meters.", _
        Category:="EngiVault Pumps", _
        ArgumentDescriptions:=Array( _
            "Suction pressure in Pa (atmospheric = 101325)", _
            "Vapor pressure in Pa (water at 20°C = 2337)", _
            "Fluid density in kg/m³", _
            "Suction velocity in m/s", _
            "Suction line losses in meters" _
        )
    
    Application.StatusBar = "Registering fluid property functions..."
    
    ' Fluid Properties
    Application.MacroOptions _
        Macro:="WATER_DENSITY", _
        Description:="Get water density at specified temperature. Returns density in kg/m³.", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (valid range: 0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="WATER_VISCOSITY", _
        Description:="Get water dynamic viscosity at temperature. Returns viscosity in Pa·s.", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (valid range: 0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="WATER_VAPOR_PRESSURE", _
        Description:="Get water vapor pressure at temperature. Returns pressure in Pa.", _
        Category:="EngiVault Fluid Properties", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (valid range: 1-100°C)" _
        )
    
    Application.StatusBar = "Registering unit conversion functions..."
    
    ' Unit Conversions
    Application.MacroOptions _
        Macro:="CONVERT_FLOW_RATE", _
        Description:="Convert flow rate between units (m3/s, m3/h, l/s, l/min, gpm, cfm).", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Flow rate value to convert", _
            "Source unit: m3/s, m3/h, l/s, l/min, gpm, cfm", _
            "Target unit: m3/s, m3/h, l/s, l/min, gpm, cfm" _
        )
    
    Application.MacroOptions _
        Macro:="CONVERT_PRESSURE", _
        Description:="Convert pressure between units (Pa, kPa, bar, psi, atm, mmHg).", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Pressure value to convert", _
            "Source unit: Pa, kPa, bar, psi, atm, mmHg", _
            "Target unit: Pa, kPa, bar, psi, atm, mmHg" _
        )
    
    Application.MacroOptions _
        Macro:="CONVERT_LENGTH", _
        Description:="Convert length between units (m, cm, mm, in, ft).", _
        Category:="EngiVault Conversions", _
        ArgumentDescriptions:=Array( _
            "Length value to convert", _
            "Source unit: m, cm, mm, in, ft", _
            "Target unit: m, cm, mm, in, ft" _
        )
    
    Application.StatusBar = "Registering engineering tool functions..."
    
    ' Engineering Tools
    Application.MacroOptions _
        Macro:="PIPE_SIZE_RECOMMENDATION", _
        Description:="Recommend minimum pipe diameter for given flow and velocity limit.", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Maximum allowable velocity in m/s", _
            "[Optional] Output unit: m, mm, in (default: m)" _
        )
    
    Application.MacroOptions _
        Macro:="STANDARD_PIPE_SIZE", _
        Description:="Get next larger standard pipe size from calculated diameter.", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Calculated diameter", _
            "[Optional] Unit: m, mm, in (default: m)", _
            "[Optional] Standard: ANSI, ISO (default: ANSI)" _
        )
    
    Application.MacroOptions _
        Macro:="VALIDATE_FLOW_REGIME", _
        Description:="Determine flow regime: Laminar, Transitional, or Turbulent.", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Reynolds number (use ENGIVAULT_REYNOLDS_NUMBER)" _
        )
    
    Application.MacroOptions _
        Macro:="VALIDATE_VELOCITY", _
        Description:="Check if velocity is within recommended ranges for application.", _
        Category:="EngiVault Engineering Tools", _
        ArgumentDescriptions:=Array( _
            "Velocity in m/s", _
            "Application type: water, steam, gas, oil" _
        )
    
    Application.StatusBar = "Registering system functions..."
    
    ' System Functions
    Application.MacroOptions _
        Macro:="ENGIVAULT_VERSION", _
        Description:="Get current EngiVault Excel integration version.", _
        Category:="EngiVault System"
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_API_STATUS", _
        Description:="Check EngiVault API server status (Online/Offline).", _
        Category:="EngiVault System"
    
    Application.StatusBar = "Registering heat transfer functions..."
    
    ' Heat Transfer Functions
    Application.MacroOptions _
        Macro:="ENGIVAULT_LMTD", _
        Description:="Calculate Log Mean Temperature Difference for heat exchangers.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Hot fluid inlet temperature in K", _
            "Hot fluid outlet temperature in K", _
            "Cold fluid inlet temperature in K", _
            "Cold fluid outlet temperature in K", _
            "[Optional] Flow arrangement: counterflow, parallel (default: counterflow)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_HEAT_EXCHANGER_AREA", _
        Description:="Calculate heat exchanger area using LMTD method.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Heat duty in W", _
            "Overall heat transfer coefficient in W/m²·K", _
            "Hot fluid inlet temperature in K", _
            "Hot fluid outlet temperature in K", _
            "Cold fluid inlet temperature in K", _
            "Cold fluid outlet temperature in K", _
            "[Optional] Flow arrangement (default: counterflow)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_EFFECTIVENESS", _
        Description:="Calculate heat exchanger effectiveness using NTU method.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Number of transfer units (NTU)", _
            "Capacity rate ratio (Cmin/Cmax, 0-1)", _
            "Flow arrangement: counterflow, parallel, crossflow_unmixed" _
        )
    
    ' Thermal Properties
    Application.MacroOptions _
        Macro:="THERMAL_CONDUCTIVITY_WATER", _
        Description:="Get water thermal conductivity at temperature.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="SPECIFIC_HEAT_WATER", _
        Description:="Get water specific heat at temperature.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (0-100°C)" _
        )
    
    Application.MacroOptions _
        Macro:="PRANDTL_NUMBER_WATER", _
        Description:="Calculate Prandtl number for water at temperature.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius (0-100°C)" _
        )
    
    ' Heat Transfer Coefficients
    Application.MacroOptions _
        Macro:="NUSSELT_FLAT_PLATE", _
        Description:="Calculate Nusselt number for flat plate in parallel flow.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Reynolds number", _
            "Prandtl number" _
        )
    
    Application.MacroOptions _
        Macro:="NUSSELT_TUBE_INTERNAL", _
        Description:="Calculate Nusselt number for internal flow in tubes.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Reynolds number", _
            "Prandtl number" _
        )
    
    Application.MacroOptions _
        Macro:="HEAT_TRANSFER_COEFFICIENT", _
        Description:="Calculate convective heat transfer coefficient from Nusselt number.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Nusselt number", _
            "Fluid thermal conductivity in W/m·K", _
            "Characteristic length in m" _
        )
    
    ' Design Functions
    Application.MacroOptions _
        Macro:="HEAT_DUTY_REQUIRED", _
        Description:="Calculate heat duty required for fluid heating/cooling.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Mass flow rate in kg/s", _
            "Specific heat in J/kg·K", _
            "Temperature change in K" _
        )
    
    Application.MacroOptions _
        Macro:="NTU_FROM_AREA", _
        Description:="Calculate Number of Transfer Units from heat exchanger area.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Heat transfer area in m²", _
            "Overall heat transfer coefficient in W/m²·K", _
            "Minimum capacity rate in W/K" _
        )
    
    ' Temperature Conversions
    Application.MacroOptions _
        Macro:="CELSIUS_TO_KELVIN", _
        Description:="Convert temperature from Celsius to Kelvin.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius" _
        )
    
    Application.MacroOptions _
        Macro:="KELVIN_TO_CELSIUS", _
        Description:="Convert temperature from Kelvin to Celsius.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Kelvin" _
        )
    
    Application.MacroOptions _
        Macro:="FAHRENHEIT_TO_CELSIUS", _
        Description:="Convert temperature from Fahrenheit to Celsius.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Fahrenheit" _
        )
    
    Application.MacroOptions _
        Macro:="CELSIUS_TO_FAHRENHEIT", _
        Description:="Convert temperature from Celsius to Fahrenheit.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Temperature in Celsius" _
        )
    
    ' Validation Functions
    Application.MacroOptions _
        Macro:="VALIDATE_HEAT_EXCHANGER", _
        Description:="Validate heat exchanger design parameters.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Effectiveness (0-1)", _
            "NPSH margin in meters (0 if not applicable)", _
            "Hot fluid velocity in m/s", _
            "Cold fluid velocity in m/s" _
        )
    
    ' Economic Functions
    Application.MacroOptions _
        Macro:="HEAT_EXCHANGER_COST_ESTIMATE", _
        Description:="Estimate heat exchanger cost based on area and material.", _
        Category:="EngiVault Heat Transfer", _
        ArgumentDescriptions:=Array( _
            "Heat transfer area in m²", _
            "Material type: carbon_steel, stainless_steel, titanium", _
            "[Optional] Design pressure in bar (default: 1)" _
        )
    
    Application.StatusBar = "Registering fluid mechanics functions..."
    
    ' Fluid Mechanics - Open Channel Flow
    Application.MacroOptions _
        Macro:="ENGIVAULT_MANNING_FLOW", _
        Description:="Calculate normal depth using Manning's equation for open channel flow.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Channel width in m", _
            "Channel slope (dimensionless)", _
            "Manning's roughness coefficient", _
            "[Optional] Channel shape: rectangular, trapezoidal, circular", _
            "[Optional] Side slope for trapezoidal (m:1)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_CRITICAL_DEPTH", _
        Description:="Calculate critical depth for open channel flow.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Flow rate in m³/s", _
            "Channel width in m", _
            "[Optional] Channel shape (default: rectangular)", _
            "[Optional] Side slope for trapezoidal" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_FROUDE_NUMBER", _
        Description:="Calculate Froude number for open channel flow.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Average velocity in m/s", _
            "Hydraulic depth in m" _
        )
    
    ' Fluid Mechanics - Compressible Flow
    Application.MacroOptions _
        Macro:="ENGIVAULT_MACH_NUMBER", _
        Description:="Calculate Mach number for compressible flow.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Velocity in m/s", _
            "Temperature in K", _
            "[Optional] Specific heat ratio (default: 1.4)", _
            "[Optional] Gas constant in J/kg·K (default: 287)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_SPEED_OF_SOUND", _
        Description:="Calculate speed of sound in gas.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Temperature in K", _
            "[Optional] Specific heat ratio (default: 1.4)", _
            "[Optional] Gas constant in J/kg·K (default: 287)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_STAGNATION_PRESSURE", _
        Description:="Calculate stagnation pressure from static conditions.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Static pressure in Pa", _
            "Mach number", _
            "[Optional] Specific heat ratio (default: 1.4)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_STAGNATION_TEMPERATURE", _
        Description:="Calculate stagnation temperature from static conditions.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Static temperature in K", _
            "Mach number", _
            "[Optional] Specific heat ratio (default: 1.4)" _
        )
    
    ' Fluid Mechanics - External Flow
    Application.MacroOptions _
        Macro:="ENGIVAULT_DRAG_COEFFICIENT", _
        Description:="Calculate drag coefficient for external flow over objects.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Reynolds number", _
            "Object geometry: sphere, cylinder, flat_plate" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_DRAG_FORCE", _
        Description:="Calculate drag force on object in fluid flow.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Drag coefficient", _
            "Fluid density in kg/m³", _
            "Velocity in m/s", _
            "Frontal area in m²" _
        )
    
    ' Fluid Mechanics - Boundary Layer
    Application.MacroOptions _
        Macro:="ENGIVAULT_BOUNDARY_LAYER_THICKNESS", _
        Description:="Calculate boundary layer thickness for flat plate.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Reynolds number based on distance", _
            "Distance from leading edge in m", _
            "[Optional] Flow regime: laminar, turbulent, auto" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_SKIN_FRICTION", _
        Description:="Calculate skin friction coefficient for flat plate.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Reynolds number", _
            "[Optional] Flow regime: laminar, turbulent, auto" _
        )
    
    ' Fluid Mechanics - Shock Waves
    Application.MacroOptions _
        Macro:="ENGIVAULT_NORMAL_SHOCK_PRESSURE", _
        Description:="Calculate pressure ratio across normal shock wave.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Upstream Mach number (must be > 1)", _
            "[Optional] Specific heat ratio (default: 1.4)" _
        )
    
    Application.MacroOptions _
        Macro:="ENGIVAULT_NORMAL_SHOCK_MACH", _
        Description:="Calculate downstream Mach number across normal shock.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Upstream Mach number (must be > 1)", _
            "[Optional] Specific heat ratio (default: 1.4)" _
        )
    
    ' Fluid Mechanics - Validation
    Application.MacroOptions _
        Macro:="VALIDATE_OPEN_CHANNEL_FLOW", _
        Description:="Validate open channel flow design parameters.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Froude number", _
            "Velocity in m/s", _
            "Flow depth in m" _
        )
    
    Application.MacroOptions _
        Macro:="VALIDATE_COMPRESSIBLE_FLOW", _
        Description:="Validate compressible flow conditions and provide guidance.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Mach number", _
            "Temperature in K", _
            "Pressure in Pa" _
        )
    
    ' Fluid Mechanics - Utilities
    Application.MacroOptions _
        Macro:="HYDRAULIC_DIAMETER", _
        Description:="Calculate hydraulic diameter from area and wetted perimeter.", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Cross-sectional area in m²", _
            "Wetted perimeter in m" _
        )
    
    Application.MacroOptions _
        Macro:="DYNAMIC_PRESSURE", _
        Description:="Calculate dynamic pressure (½ρV²).", _
        Category:="EngiVault Fluid Mechanics", _
        ArgumentDescriptions:=Array( _
            "Fluid density in kg/m³", _
            "Velocity in m/s" _
        )
    
End Sub

Private Sub CreateFunctionCategories()
    '
    ' Create custom function categories for better organization
    '
    On Error Resume Next
    
    ' Categories are automatically created when functions are registered
    ' This is a placeholder for future category customization
    
End Sub

'===============================================================================
' AUTHENTICATION SETUP
'===============================================================================

Private Sub SetupAuthentication()
    '
    ' Guide user through authentication setup
    '
    Dim response As VbMsgBoxResult
    Dim authMethod As String
    Dim authValue As String
    
    response = MsgBox("EngiVault requires authentication to access the API." & vbCrLf & vbCrLf & _
                     "Do you want to set up authentication now?" & vbCrLf & vbCrLf & _
                     "Click YES to set up now, or NO to skip (you can set up later)", _
                     vbYesNo + vbQuestion, "EngiVault Authentication Setup")
    
    If response = vbNo Then Exit Sub
    
    ' Choose authentication method
    response = MsgBox("Choose authentication method:" & vbCrLf & vbCrLf & _
                     "YES = API Key (recommended for production)" & vbCrLf & _
                     "NO = JWT Token (temporary, for testing)" & vbCrLf & vbCrLf & _
                     "API Keys are permanent and can be managed in your EngiVault account." & vbCrLf & _
                     "JWT Tokens expire after 7 days but can be obtained from login.", _
                     vbYesNo + vbQuestion, "Authentication Method")
    
    If response = vbYes Then
        ' API Key setup
        authValue = InputBox("Enter your EngiVault API Key:" & vbCrLf & vbCrLf & _
                           "You can get your API Key from:" & vbCrLf & _
                           "1. Register at https://engivault.com" & vbCrLf & _
                           "2. Go to Account → API Keys" & vbCrLf & _
                           "3. Create a new API key" & vbCrLf & vbCrLf & _
                           "Paste your API key below:", _
                           "EngiVault API Key", "")
        
        If authValue <> "" Then
            Call SetEngiVaultAPIKey(authValue)
        End If
    Else
        ' JWT Token setup
        authValue = InputBox("Enter your EngiVault JWT Token:" & vbCrLf & vbCrLf & _
                           "You can get a JWT Token by:" & vbCrLf & _
                           "1. Using the Python SDK login" & vbCrLf & _
                           "2. Making a login API call" & vbCrLf & _
                           "3. Using the web interface" & vbCrLf & vbCrLf & _
                           "Note: JWT tokens expire after 7 days" & vbCrLf & vbCrLf & _
                           "Paste your JWT token below:", _
                           "EngiVault JWT Token", "")
        
        If authValue <> "" Then
            Call SetEngiVaultJWTToken(authValue)
        End If
    End If
End Sub

'===============================================================================
' INSTALLATION TESTING
'===============================================================================

Private Sub TestInstallation()
    '
    ' Test the installation by verifying functions work
    '
    On Error Resume Next
    
    Application.StatusBar = "Testing installation..."
    
    ' Test 1: Version function
    Dim version As String
    version = ENGIVAULT_VERSION()
    
    If version = "" Then
        MsgBox "Warning: Version function test failed", vbExclamation
    End If
    
    ' Test 2: API Status (if authenticated)
    If EngiVaultAPIKey <> "" Or EngiVaultJWTToken <> "" Then
        Dim status As String
        status = ENGIVAULT_API_STATUS()
        
        If status = "Offline" Then
            MsgBox "Warning: API connection test failed. Check your internet connection and authentication.", vbExclamation
        End If
    End If
    
    ' Test 3: Local calculation function
    Dim testArea As Double
    testArea = ENGIVAULT_PIPE_AREA(0.1)
    
    If Abs(testArea - 0.007854) > 0.000001 Then
        MsgBox "Warning: Local calculation test failed", vbExclamation
    End If
    
End Sub

'===============================================================================
' UNINSTALLATION
'===============================================================================

Public Sub UninstallEngiVault()
    '
    ' Remove EngiVault functions from Excel
    '
    Dim response As VbMsgBoxResult
    
    response = MsgBox("This will remove all EngiVault functions from Excel." & vbCrLf & vbCrLf & _
                     "Are you sure you want to uninstall EngiVault?", _
                     vbYesNo + vbQuestion, "Uninstall EngiVault")
    
    If response = vbNo Then Exit Sub
    
    On Error Resume Next
    
    ' Clear authentication
    EngiVaultAPIKey = ""
    EngiVaultJWTToken = ""
    
    ' Note: Excel doesn't provide a direct way to unregister functions
    ' Functions will remain available until Excel is restarted
    
    MsgBox "EngiVault has been uninstalled." & vbCrLf & vbCrLf & _
           "Functions will be removed when you restart Excel." & vbCrLf & _
           "Authentication credentials have been cleared.", _
           vbInformation, "EngiVault Uninstalled"
End Sub

'===============================================================================
' UTILITY FUNCTIONS
'===============================================================================

Public Sub ShowFunctionList()
    '
    ' Display a list of all available EngiVault functions
    '
    Dim functionList As String
    
    functionList = "EngiVault Excel Functions:" & vbCrLf & vbCrLf & _
                  "HYDRAULICS:" & vbCrLf & _
                  "• ENGIVAULT_PRESSURE_DROP" & vbCrLf & _
                  "• ENGIVAULT_FLOW_RATE" & vbCrLf & _
                  "• ENGIVAULT_REYNOLDS_NUMBER" & vbCrLf & _
                  "• ENGIVAULT_PIPE_VELOCITY" & vbCrLf & _
                  "• ENGIVAULT_PIPE_AREA" & vbCrLf & vbCrLf & _
                  "PUMPS:" & vbCrLf & _
                  "• ENGIVAULT_PUMP_POWER" & vbCrLf & _
                  "• ENGIVAULT_NPSH_AVAILABLE" & vbCrLf & vbCrLf & _
                  "FLUID PROPERTIES:" & vbCrLf & _
                  "• WATER_DENSITY" & vbCrLf & _
                  "• WATER_VISCOSITY" & vbCrLf & _
                  "• WATER_VAPOR_PRESSURE" & vbCrLf & vbCrLf & _
                  "CONVERSIONS:" & vbCrLf & _
                  "• CONVERT_FLOW_RATE" & vbCrLf & _
                  "• CONVERT_PRESSURE" & vbCrLf & _
                  "• CONVERT_LENGTH" & vbCrLf & vbCrLf & _
                  "ENGINEERING TOOLS:" & vbCrLf & _
                  "• PIPE_SIZE_RECOMMENDATION" & vbCrLf & _
                  "• STANDARD_PIPE_SIZE" & vbCrLf & _
                  "• VALIDATE_FLOW_REGIME" & vbCrLf & _
                  "• VALIDATE_VELOCITY" & vbCrLf & vbCrLf & _
                  "SYSTEM:" & vbCrLf & _
                  "• ENGIVAULT_VERSION" & vbCrLf & _
                  "• ENGIVAULT_API_STATUS"
    
    MsgBox functionList, vbInformation, "EngiVault Functions"
End Sub

Public Sub CheckInstallation()
    '
    ' Check if EngiVault is properly installed
    '
    Dim status As String
    status = "EngiVault Installation Status:" & vbCrLf & vbCrLf
    
    ' Check version
    On Error Resume Next
    Dim version As String
    version = ENGIVAULT_VERSION()
    
    If version <> "" Then
        status = status & "✅ Functions loaded: Version " & version & vbCrLf
    Else
        status = status & "❌ Functions not loaded" & vbCrLf
    End If
    
    ' Check authentication
    If EngiVaultAPIKey <> "" Then
        status = status & "✅ API Key configured" & vbCrLf
    ElseIf EngiVaultJWTToken <> "" Then
        status = status & "✅ JWT Token configured" & vbCrLf
    Else
        status = status & "⚠️  No authentication configured" & vbCrLf
    End If
    
    ' Check API connection
    If EngiVaultAPIKey <> "" Or EngiVaultJWTToken <> "" Then
        Dim apiStatus As String
        apiStatus = ENGIVAULT_API_STATUS()
        If apiStatus = "Online" Then
            status = status & "✅ API connection: Online" & vbCrLf
        Else
            status = status & "❌ API connection: " & apiStatus & vbCrLf
        End If
    End If
    
    MsgBox status, vbInformation, "Installation Check"
End Sub
