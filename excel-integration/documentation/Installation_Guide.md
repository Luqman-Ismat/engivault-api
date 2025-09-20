# EngiVault Excel Integration - Installation Guide

## Overview

The EngiVault Excel Integration brings powerful engineering calculations directly to Microsoft Excel through custom functions. Engineers can now perform complex hydraulic and pump calculations using simple Excel formulas.

## System Requirements

### Excel Requirements
- **Microsoft Excel 2016 or later** (Windows/Mac)
- **Excel for Microsoft 365** (Recommended)
- **Macro support enabled**

### Network Requirements
- **Internet connection** for API calls
- **HTTPS access** to `engivault-api-production.up.railway.app`
- **Firewall exceptions** if behind corporate firewall

### Authentication Requirements
- **EngiVault API Key** or **JWT Token**
- **Active EngiVault subscription** (Free tier available)

## Installation Steps

### Step 1: Download VBA Modules

Download the following files:
- `EngiVaultAPI.bas` - Main API functions
- `EngiVaultHelpers.bas` - Helper and utility functions

### Step 2: Import VBA Modules

1. **Open Excel**
2. **Press Alt + F11** to open VBA Editor
3. **Right-click on VBAProject** in the Project Explorer
4. **Select Import File...**
5. **Navigate to and select `EngiVaultAPI.bas`**
6. **Repeat for `EngiVaultHelpers.bas`**

### Step 3: Enable Macros

1. **Go to File → Options → Trust Center**
2. **Click "Trust Center Settings"**
3. **Select "Macro Settings"**
4. **Choose "Enable all macros"** (or "Disable with notification")
5. **Click OK**

### Step 4: Set Up Authentication

#### Option A: Using JWT Token (Temporary)
```vba
Sub SetupAuth()
    Call SetEngiVaultJWTToken("your-jwt-token-here")
End Sub
```

#### Option B: Using API Key (Recommended)
```vba
Sub SetupAuth()
    Call SetEngiVaultAPIKey("your-api-key-here")
End Sub
```

### Step 5: Test Installation

1. **Create a new worksheet**
2. **In cell A1, enter**: `=ENGIVAULT_VERSION()`
3. **In cell A2, enter**: `=ENGIVAULT_API_STATUS()`
4. **Press Enter**

**Expected Results:**
- A1: `1.0.0`
- A2: `Online`

## Configuration Options

### API Settings
```vba
' Change API base URL (if using custom deployment)
Private Const API_BASE_URL As String = "https://your-custom-api.com"

' Change API version
Private Const API_VERSION As String = "v1"
```

### Error Handling
```vba
' Enable debug mode for troubleshooting
Public Const DEBUG_MODE As Boolean = True
```

### Performance Settings
```vba
' Enable caching for repeated calculations
Public Const ENABLE_CACHING As Boolean = True

' Set cache timeout (seconds)
Public Const CACHE_TIMEOUT As Long = 300
```

## Verification Tests

### Basic Function Test
```excel
=ENGIVAULT_PRESSURE_DROP(0.1, 0.1, 100, 1000, 0.001)
```
**Expected Result**: ~762517 (pressure drop in Pa)

### Helper Function Test
```excel
=WATER_DENSITY(20)
```
**Expected Result**: ~998.2 (density in kg/m³)

### Unit Conversion Test
```excel
=CONVERT_FLOW_RATE(100, "gpm", "m3/s")
```
**Expected Result**: ~0.0063 (flow rate in m³/s)

## Troubleshooting

### Common Issues

#### 1. #NAME? Error
**Cause**: VBA modules not imported or macros disabled
**Solution**: 
- Re-import VBA modules
- Enable macros in Trust Center settings
- Save file as .xlsm (macro-enabled)

#### 2. #VALUE! Error
**Cause**: API authentication not set or invalid
**Solution**:
- Run authentication setup macro
- Verify API key/token is valid
- Check internet connection

#### 3. Function Returns "Offline"
**Cause**: Cannot connect to EngiVault API
**Solution**:
- Check internet connection
- Verify firewall settings
- Try accessing API URL in browser

#### 4. Slow Performance
**Cause**: Multiple API calls without caching
**Solution**:
- Enable caching in VBA code
- Use manual calculation mode for large datasets
- Minimize API calls in array formulas

### Debug Mode

Enable debug mode for detailed error information:

```vba
Public Const DEBUG_MODE As Boolean = True
```

Check the **Immediate Window** (Ctrl+G in VBA Editor) for error messages.

### Network Troubleshooting

#### Corporate Firewall
Add these URLs to firewall exceptions:
- `https://engivault-api-production.up.railway.app`
- `*.railway.app` (wildcard)

#### Proxy Settings
If behind a proxy, configure Excel/VBA proxy settings:
```vba
' Add proxy configuration in MakeAPIRequest function
http.setRequestHeader "Proxy-Authorization", "Basic " & Base64Encode("username:password")
```

## Security Considerations

### API Key Storage
- **Never hardcode** API keys in shared workbooks
- **Use environment variables** or secure storage
- **Rotate keys regularly**

### Macro Security
- **Sign VBA modules** with digital certificate
- **Use trusted locations** for workbooks
- **Review code** before enabling macros

### Network Security
- **Use HTTPS only** (default in EngiVault)
- **Validate SSL certificates**
- **Monitor API usage** for unusual activity

## Advanced Configuration

### Custom Error Messages
```vba
Private Function GetCustomErrorMessage(errorCode As Long) As String
    Select Case errorCode
        Case 1001: GetCustomErrorMessage = "Authentication required"
        Case 1002: GetCustomErrorMessage = "API request failed"
        Case 1003: GetCustomErrorMessage = "Invalid response format"
        Case Else: GetCustomErrorMessage = "Unknown error"
    End Select
End Function
```

### Batch Processing
```vba
Public Function ProcessBatchCalculations(dataRange As Range) As Variant
    ' Disable screen updating for performance
    Application.ScreenUpdating = False
    
    ' Process calculations
    ' ... batch logic here ...
    
    ' Re-enable screen updating
    Application.ScreenUpdating = True
End Function
```

### Automatic Updates
```vba
Private Sub Workbook_Open()
    ' Check for VBA module updates
    CheckForUpdates
    
    ' Validate API connection
    If ENGIVAULT_API_STATUS() <> "Online" Then
        MsgBox "EngiVault API is not accessible. Check your connection.", vbWarning
    End If
End Sub
```

## Uninstallation

### Remove VBA Modules
1. **Open VBA Editor** (Alt + F11)
2. **Right-click on each module** (EngiVaultAPI, EngiVaultHelpers)
3. **Select "Remove [ModuleName]"**
4. **Click "No"** when asked to export (unless you want to keep a copy)

### Reset Excel Settings
1. **Go to File → Options → Trust Center → Trust Center Settings**
2. **Reset macro security** to default level
3. **Clear trusted locations** if added

### Remove Authentication
```vba
Sub ClearAuth()
    EngiVaultAPIKey = ""
    EngiVaultJWTToken = ""
    MsgBox "Authentication cleared", vbInformation
End Sub
```

## Support and Updates

### Getting Help
- **Documentation**: Check function comments in VBA modules
- **Examples**: See template workbooks
- **API Status**: Use `=ENGIVAULT_API_STATUS()` function
- **Version**: Use `=ENGIVAULT_VERSION()` function

### Updates
- **Check GitHub** for latest VBA modules
- **Subscribe** to EngiVault newsletter for updates
- **Follow** version numbers in `ENGIVAULT_VERSION()`

### Community
- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join EngiVault community
- **Email**: support@engivault.com

---

**🎉 You're ready to use EngiVault in Excel!**

Start with the basic examples and gradually explore advanced features. The integration brings the power of professional engineering calculations directly to your spreadsheets.
