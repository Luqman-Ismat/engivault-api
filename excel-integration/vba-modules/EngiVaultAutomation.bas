Attribute VB_Name = "EngiVaultAutomation"
'===============================================================================
' EngiVault Excel Integration - Advanced Automation
' VBA Module for Template Generation and Workflow Automation
'
' Version: 1.3.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' TEMPLATE GENERATION
'===============================================================================

Public Sub CreatePipeSizingTemplate()
    '
    ' Create comprehensive pipe sizing template with automation
    '
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim templateName As String
    
    templateName = "Pipe Sizing Analysis"
    
    ' Create new worksheet
    Set ws = ThisWorkbook.Worksheets.Add
    ws.Name = templateName
    
    ' Template header
    With ws.Range("A1:J1")
        .Merge
        .Value = "EngiVault Pipe Sizing Analysis Template"
        .Font.Size = 16
        .Font.Bold = True
        .HorizontalAlignment = xlCenter
        .Interior.Color = RGB(0, 100, 200)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Input section
    ws.Range("A3").Value = "INPUT PARAMETERS"
    ws.Range("A3").Font.Bold = True
    ws.Range("A3").Interior.Color = RGB(220, 240, 255)
    
    ws.Range("A4").Value = "Flow Rate (m³/s):"
    ws.Range("B4").Value = 0.1
    ws.Range("A5").Value = "Pipe Length (m):"
    ws.Range("B5").Value = 100
    ws.Range("A6").Value = "Fluid Density (kg/m³):"
    ws.Range("B6").Value = 1000
    ws.Range("A7").Value = "Fluid Viscosity (Pa·s):"
    ws.Range("B7").Value = 0.001
    ws.Range("A8").Value = "Max Pressure Drop (Pa):"
    ws.Range("B8").Value = 50000
    ws.Range("A9").Value = "Max Velocity (m/s):"
    ws.Range("B9").Value = 3
    
    ' Pipe diameter options
    ws.Range("D3").Value = "PIPE DIAMETER OPTIONS"
    ws.Range("D3").Font.Bold = True
    ws.Range("D3").Interior.Color = RGB(220, 240, 255)
    
    Dim diameters As Variant
    diameters = Array(0.05, 0.08, 0.1, 0.125, 0.15, 0.2, 0.25, 0.3)
    
    ws.Range("D4").Value = "Diameter (m)"
    ws.Range("E4").Value = "Area (m²)"
    ws.Range("F4").Value = "Velocity (m/s)"
    ws.Range("G4").Value = "Reynolds"
    ws.Range("H4").Value = "Pressure Drop (Pa)"
    ws.Range("I4").Value = "Status"
    ws.Range("J4").Value = "Cost Factor"
    
    ' Fill diameter analysis table
    Dim i As Long
    For i = 0 To UBound(diameters)
        ws.Cells(5 + i, 4).Value = diameters(i)
        ws.Cells(5 + i, 5).Value = "=ENGIVAULT_PIPE_AREA(D" & (5 + i) & ")"
        ws.Cells(5 + i, 6).Value = "=ENGIVAULT_PIPE_VELOCITY($B$4,D" & (5 + i) & ")"
        ws.Cells(5 + i, 7).Value = "=ENGIVAULT_REYNOLDS_NUMBER($B$4,D" & (5 + i) & ",$B$6,$B$7)"
        ws.Cells(5 + i, 8).Value = "=ENGIVAULT_PRESSURE_DROP($B$4,D" & (5 + i) & ",$B$5,$B$6,$B$7)"
        ws.Cells(5 + i, 9).Value = "=IF(AND(H" & (5 + i) & "<=$B$8,F" & (5 + i) & "<=$B$9),""✓ OK"",""✗ Fail"")"
        ws.Cells(5 + i, 10).Value = "=D" & (5 + i) & "*1000"  ' Relative cost factor
    Next i
    
    ' Results section
    ws.Range("A15").Value = "RESULTS"
    ws.Range("A15").Font.Bold = True
    ws.Range("A15").Interior.Color = RGB(200, 255, 200)
    
    ws.Range("A16").Value = "Recommended Diameter (m):"
    ws.Range("B16").Value = "=PIPE_SIZE_RECOMMENDATION(B4,B9)"
    ws.Range("A17").Value = "Standard Size (m):"
    ws.Range("B17").Value = "=STANDARD_PIPE_SIZE(B16)"
    ws.Range("A18").Value = "Selected Diameter (m):"
    ws.Range("B18").Value = "=INDEX(D5:D12,MATCH(""✓ OK"",I5:I12,0))"
    ws.Range("A19").Value = "Final Pressure Drop (Pa):"
    ws.Range("B19").Value = "=ENGIVAULT_PRESSURE_DROP(B4,B18,B5,B6,B7)"
    ws.Range("A20").Value = "Final Velocity (m/s):"
    ws.Range("B20").Value = "=ENGIVAULT_PIPE_VELOCITY(B4,B18)"
    
    ' Add conditional formatting
    With ws.Range("I5:I12")
        .FormatConditions.Add Type:=xlTextString, String:="✓ OK", TextOperator:=xlContains
        .FormatConditions(1).Interior.Color = RGB(200, 255, 200)
        .FormatConditions.Add Type:=xlTextString, String:="✗ Fail", TextOperator:=xlContains
        .FormatConditions(2).Interior.Color = RGB(255, 200, 200)
    End With
    
    ' Auto-fit columns
    ws.Columns("A:J").AutoFit
    
    ' Add chart button
    Dim btn As Button
    Set btn = ws.Buttons.Add(350, 350, 120, 30)
    btn.Text = "Create System Curve"
    btn.OnAction = "CreateSystemCurveFromTemplate"
    
    ws.Activate
    MsgBox "Pipe sizing template created successfully!" & vbCrLf & _
           "Modify the input parameters and the analysis will update automatically.", _
           vbInformation, "EngiVault Template"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating pipe sizing template: " & Err.Description, vbCritical, "EngiVault Template"
End Sub

Public Sub CreateHeatExchangerTemplate()
    '
    ' Create comprehensive heat exchanger design template
    '
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim templateName As String
    
    templateName = "Heat Exchanger Design"
    
    ' Create new worksheet
    Set ws = ThisWorkbook.Worksheets.Add
    ws.Name = templateName
    
    ' Template header
    With ws.Range("A1:L1")
        .Merge
        .Value = "EngiVault Heat Exchanger Design Template"
        .Font.Size = 16
        .Font.Bold = True
        .HorizontalAlignment = xlCenter
        .Interior.Color = RGB(200, 100, 0)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Process conditions
    ws.Range("A3").Value = "PROCESS CONDITIONS"
    ws.Range("A3").Font.Bold = True
    ws.Range("A3").Interior.Color = RGB(255, 230, 200)
    
    ws.Range("A4").Value = "Heat Duty (kW):"
    ws.Range("B4").Value = 100
    ws.Range("A5").Value = "Hot Fluid Inlet (°C):"
    ws.Range("B5").Value = 80
    ws.Range("A6").Value = "Hot Fluid Outlet (°C):"
    ws.Range("B6").Value = 60
    ws.Range("A7").Value = "Cold Fluid Inlet (°C):"
    ws.Range("B7").Value = 20
    ws.Range("A8").Value = "Cold Fluid Outlet (°C):"
    ws.Range("B8").Value = 40
    ws.Range("A9").Value = "Flow Arrangement:"
    ws.Range("B9").Value = "counterflow"
    
    ' Heat exchanger options
    ws.Range("D3").Value = "HEAT EXCHANGER OPTIONS"
    ws.Range("D3").Font.Bold = True
    ws.Range("D3").Interior.Color = RGB(255, 230, 200)
    
    ws.Range("D4").Value = "Overall U (W/m²·K)"
    ws.Range("E4").Value = "Area (m²)"
    ws.Range("F4").Value = "LMTD (K)"
    ws.Range("G4").Value = "Effectiveness"
    ws.Range("H4").Value = "Cost ($)"
    ws.Range("I4").Value = "Material"
    ws.Range("J4").Value = "Pressure (bar)"
    
    ' Heat exchanger analysis
    Dim overallUs As Variant
    Dim materials As Variant
    Dim pressures As Variant
    
    overallUs = Array(300, 500, 800, 1200, 2000)
    materials = Array("carbon_steel", "stainless_steel", "titanium", "hastelloy", "stainless_steel")
    pressures = Array(5, 10, 15, 20, 25)
    
    For i = 0 To UBound(overallUs)
        ws.Cells(5 + i, 4).Value = overallUs(i)
        ws.Cells(5 + i, 5).Value = "=ENGIVAULT_HEAT_EXCHANGER_AREA(B4*1000,D" & (5 + i) & ",CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B7),CELSIUS_TO_KELVIN(B8),B9)"
        ws.Cells(5 + i, 6).Value = "=ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B5),CELSIUS_TO_KELVIN(B6),CELSIUS_TO_KELVIN(B7),CELSIUS_TO_KELVIN(B8),B9)"
        ws.Cells(5 + i, 7).Value = "=ENGIVAULT_EFFECTIVENESS(NTU_FROM_AREA(E" & (5 + i) & ",D" & (5 + i) & ",2000),0.8,B9)"
        ws.Cells(5 + i, 8).Value = "=HEAT_EXCHANGER_COST_ESTIMATE(E" & (5 + i) & ",I" & (5 + i) & ",J" & (5 + i) & ")"
        ws.Cells(5 + i, 9).Value = materials(i)
        ws.Cells(5 + i, 10).Value = pressures(i)
    Next i
    
    ' Economic analysis
    ws.Range("A12").Value = "ECONOMIC ANALYSIS"
    ws.Range("A12").Font.Bold = True
    ws.Range("A12").Interior.Color = RGB(200, 255, 200)
    
    ws.Range("A13").Value = "Minimum Cost Option:"
    ws.Range("B13").Value = "=INDEX(D5:D9,MATCH(MIN(H5:H9),H5:H9,0))"
    ws.Range("A14").Value = "Minimum Area Option:"
    ws.Range("B14").Value = "=INDEX(D5:D9,MATCH(MIN(E5:E9),E5:E9,0))"
    ws.Range("A15").Value = "Best Effectiveness:"
    ws.Range("B15").Value = "=INDEX(D5:D9,MATCH(MAX(G5:G9),G5:G9,0))"
    
    ' Performance summary
    ws.Range("D12").Value = "PERFORMANCE SUMMARY"
    ws.Range("D12").Font.Bold = True
    ws.Range("D12").Interior.Color = RGB(200, 255, 200)
    
    ws.Range("D13").Value = "Selected Overall U:"
    ws.Range("E13").Value = "=B13"
    ws.Range("D14").Value = "Required Area:"
    ws.Range("E14").Value = "=INDEX(E5:E9,MATCH(B13,D5:D9,0))"
    ws.Range("D15").Value = "Estimated Cost:"
    ws.Range("E15").Value = "=INDEX(H5:H9,MATCH(B13,D5:D9,0))"
    ws.Range("D16").Value = "Material:"
    ws.Range("E16").Value = "=INDEX(I5:I9,MATCH(B13,D5:D9,0))"
    
    ' Add conditional formatting for cost analysis
    With ws.Range("H5:H9")
        .FormatConditions.AddColorScale ColorScaleType:=3
        .FormatConditions(1).ColorScaleCriteria(1).Type = xlConditionValueLowestValue
        .FormatConditions(1).ColorScaleCriteria(1).FormatColor.Color = RGB(99, 190, 123)
        .FormatConditions(1).ColorScaleCriteria(2).Type = xlConditionValuePercentile
        .FormatConditions(1).ColorScaleCriteria(2).Value = 50
        .FormatConditions(1).ColorScaleCriteria(2).FormatColor.Color = RGB(255, 235, 132)
        .FormatConditions(1).ColorScaleCriteria(3).Type = xlConditionValueHighestValue
        .FormatConditions(1).ColorScaleCriteria(3).FormatColor.Color = RGB(248, 105, 107)
    End With
    
    ' Auto-fit columns
    ws.Columns("A:L").AutoFit
    
    ' Add automation buttons
    Dim btnChart As Button, btnOptimize As Button, btnReport As Button
    
    Set btnChart = ws.Buttons.Add(50, 300, 100, 30)
    btnChart.Text = "Create Chart"
    btnChart.OnAction = "CreateSystemCurveFromTemplate"
    
    Set btnOptimize = ws.Buttons.Add(160, 300, 100, 30)
    btnOptimize.Text = "Optimize Size"
    btnOptimize.OnAction = "OptimizePipeSizeFromTemplate"
    
    Set btnReport = ws.Buttons.Add(270, 300, 100, 30)
    btnReport.Text = "Generate Report"
    btnReport.OnAction = "GeneratePipeReport"
    
    ws.Activate
    MsgBox "Pipe sizing template created successfully!" & vbCrLf & _
           "Use the buttons below to create charts, optimize design, and generate reports.", _
           vbInformation, "EngiVault Template"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating pipe sizing template: " & Err.Description, vbCritical, "EngiVault Template"
End Sub

Public Sub CreateFluidMechanicsTemplate()
    '
    ' Create comprehensive fluid mechanics analysis template
    '
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim templateName As String
    
    templateName = "Fluid Mechanics Analysis"
    
    ' Create new worksheet
    Set ws = ThisWorkbook.Worksheets.Add
    ws.Name = templateName
    
    ' Template header
    With ws.Range("A1:M1")
        .Merge
        .Value = "EngiVault Fluid Mechanics Analysis Template"
        .Font.Size = 16
        .Font.Bold = True
        .HorizontalAlignment = xlCenter
        .Interior.Color = RGB(100, 150, 200)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Open Channel Flow section
    ws.Range("A3").Value = "OPEN CHANNEL FLOW"
    ws.Range("A3").Font.Bold = True
    ws.Range("A3").Interior.Color = RGB(200, 230, 255)
    
    ws.Range("A4").Value = "Flow Rate (m³/s):"
    ws.Range("B4").Value = 5
    ws.Range("A5").Value = "Channel Width (m):"
    ws.Range("B5").Value = 3
    ws.Range("A6").Value = "Channel Slope:"
    ws.Range("B6").Value = 0.001
    ws.Range("A7").Value = "Manning's n:"
    ws.Range("B7").Value = 0.03
    ws.Range("A8").Value = "Channel Shape:"
    ws.Range("B8").Value = "rectangular"
    
    ws.Range("D4").Value = "Normal Depth (m):"
    ws.Range("E4").Value = "=ENGIVAULT_MANNING_FLOW(B4,B5,B6,B7,B8)"
    ws.Range("D5").Value = "Critical Depth (m):"
    ws.Range("E5").Value = "=ENGIVAULT_CRITICAL_DEPTH(B4,B5,B8)"
    ws.Range("D6").Value = "Velocity (m/s):"
    ws.Range("E6").Value = "=B4/(B5*E4)"
    ws.Range("D7").Value = "Froude Number:"
    ws.Range("E7").Value = "=ENGIVAULT_FROUDE_NUMBER(E6,E4)"
    ws.Range("D8").Value = "Flow Regime:"
    ws.Range("E8").Value = "=IF(E7<1,""Subcritical"",IF(E7>1.05,""Supercritical"",""Critical""))"
    ws.Range("D9").Value = "Design Status:"
    ws.Range("E9").Value = "=VALIDATE_OPEN_CHANNEL_FLOW(E7,E6,E4)"
    
    ' Compressible Flow section
    ws.Range("G3").Value = "COMPRESSIBLE FLOW"
    ws.Range("G3").Font.Bold = True
    ws.Range("G3").Interior.Color = RGB(255, 230, 200)
    
    ws.Range("G4").Value = "Velocity (m/s):"
    ws.Range("H4").Value = 200
    ws.Range("G5").Value = "Temperature (K):"
    ws.Range("H5").Value = 288
    ws.Range("G6").Value = "Pressure (Pa):"
    ws.Range("H6").Value = 101325
    ws.Range("G7").Value = "Gamma:"
    ws.Range("H7").Value = 1.4
    ws.Range("G8").Value = "Gas Constant:"
    ws.Range("H8").Value = 287
    
    ws.Range("J4").Value = "Mach Number:"
    ws.Range("K4").Value = "=ENGIVAULT_MACH_NUMBER(H4,H5,H7,H8)"
    ws.Range("J5").Value = "Speed of Sound (m/s):"
    ws.Range("K5").Value = "=ENGIVAULT_SPEED_OF_SOUND(H5,H7,H8)"
    ws.Range("J6").Value = "Stagnation Pressure (Pa):"
    ws.Range("K6").Value = "=ENGIVAULT_STAGNATION_PRESSURE(H6,K4,H7)"
    ws.Range("J7").Value = "Stagnation Temp (K):"
    ws.Range("K7").Value = "=ENGIVAULT_STAGNATION_TEMPERATURE(H5,K4,H7)"
    ws.Range("J8").Value = "Flow Regime:"
    ws.Range("K8").Value = "=VALIDATE_COMPRESSIBLE_FLOW(K4,H5,H6)"
    
    ' External Flow section
    ws.Range("A11").Value = "EXTERNAL FLOW ANALYSIS"
    ws.Range("A11").Font.Bold = True
    ws.Range("A11").Interior.Color = RGB(200, 255, 200)
    
    ws.Range("A12").Value = "Object Geometry:"
    ws.Range("B12").Value = "sphere"
    ws.Range("A13").Value = "Characteristic Length (m):"
    ws.Range("B13").Value = 0.1
    ws.Range("A14").Value = "Velocity (m/s):"
    ws.Range("B14").Value = 20
    ws.Range("A15").Value = "Fluid Density (kg/m³):"
    ws.Range("B15").Value = 1.225
    ws.Range("A16").Value = "Fluid Viscosity (Pa·s):"
    ws.Range("B16").Value = 0.0000181
    
    ws.Range("D12").Value = "Reynolds Number:"
    ws.Range("E12").Value = "=B14*B13*B15/B16"
    ws.Range("D13").Value = "Drag Coefficient:"
    ws.Range("E13").Value = "=ENGIVAULT_DRAG_COEFFICIENT(E12,B12)"
    ws.Range("D14").Value = "Frontal Area (m²):"
    ws.Range("E14").Value = "=PI()*(B13/2)^2"
    ws.Range("D15").Value = "Drag Force (N):"
    ws.Range("E15").Value = "=ENGIVAULT_DRAG_FORCE(E13,B15,B14,E14)"
    ws.Range("D16").Value = "Dynamic Pressure (Pa):"
    ws.Range("E16").Value = "=DYNAMIC_PRESSURE(B15,B14)"
    
    ' Auto-fit columns
    ws.Columns("A:M").AutoFit
    
    ' Add automation buttons
    Dim btnHXChart As Button, btnOptimizeHX As Button
    
    Set btnHXChart = ws.Buttons.Add(50, 400, 120, 30)
    btnHXChart.Text = "Create HX Chart"
    btnHXChart.OnAction = "CreateHeatExchangerChartFromTemplate"
    
    Set btnOptimizeHX = ws.Buttons.Add(180, 400, 120, 30)
    btnOptimizeHX.Text = "Optimize Design"
    btnOptimizeHX.OnAction = "OptimizeHeatExchangerFromTemplate"
    
    ws.Activate
    MsgBox "Heat exchanger template created successfully!" & vbCrLf & _
           "Modify parameters to analyze different heat exchanger configurations.", _
           vbInformation, "EngiVault Template"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating heat exchanger template: " & Err.Description, vbCritical, "EngiVault Template"
End Sub

'===============================================================================
' AUTOMATION HELPERS
'===============================================================================

Public Sub CreateSystemCurveFromTemplate()
    '
    ' Create system curve from current pipe sizing template
    '
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    ' Generate flow rate range
    Dim flowRates(10) As Double
    Dim i As Long
    For i = 0 To 10
        flowRates(i) = i * 0.02  ' 0 to 0.2 m³/s
    Next i
    
    ' Get pipe parameters
    Dim pipeParams(3) As Double
    pipeParams(0) = ws.Range("B18").Value  ' Selected diameter
    pipeParams(1) = ws.Range("B5").Value   ' Length
    pipeParams(2) = ws.Range("B6").Value   ' Density
    pipeParams(3) = ws.Range("B7").Value   ' Viscosity
    
    ' Create temporary ranges
    ws.Range("A25:A35").Value = Application.Transpose(flowRates)
    ws.Range("B25:E25").Value = pipeParams
    
    Call CreateSystemCurve(ws.Range("A25:A35"), ws.Range("B25:E25"), "System Curve - " & ws.Name)
End Sub

Public Sub OptimizePipeSizeFromTemplate()
    '
    ' Optimize pipe size from current template
    '
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    Dim targetPD As Double
    Dim pipeParams As Range
    Dim diameterRange As Range
    
    targetPD = ws.Range("B8").Value
    Set pipeParams = ws.Range("B4,B5:B7")  ' Flow, Length, Density, Viscosity
    Set diameterRange = ws.Range("D5:D12")
    
    Call OptimizePipeSize(targetPD, pipeParams, diameterRange)
End Sub

Public Sub GeneratePipeReport()
    '
    ' Generate comprehensive pipe sizing report
    '
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim reportWs As Worksheet
    Dim reportName As String
    
    Set ws = ActiveSheet
    reportName = "Pipe Sizing Report"
    
    ' Create report worksheet
    Set reportWs = ThisWorkbook.Worksheets.Add
    reportWs.Name = reportName
    
    ' Report header
    With reportWs.Range("A1:F1")
        .Merge
        .Value = "EngiVault Pipe Sizing Report"
        .Font.Size = 18
        .Font.Bold = True
        .HorizontalAlignment = xlCenter
        .Interior.Color = RGB(0, 100, 200)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Project information
    reportWs.Range("A3").Value = "PROJECT INFORMATION"
    reportWs.Range("A3").Font.Bold = True
    reportWs.Range("A4").Value = "Date:"
    reportWs.Range("B4").Value = Date
    reportWs.Range("A5").Value = "Engineer:"
    reportWs.Range("B5").Value = Application.UserName
    reportWs.Range("A6").Value = "Project:"
    reportWs.Range("B6").Value = "[Enter Project Name]"
    
    ' Design parameters
    reportWs.Range("A8").Value = "DESIGN PARAMETERS"
    reportWs.Range("A8").Font.Bold = True
    reportWs.Range("A9").Value = "Flow Rate:"
    reportWs.Range("B9").Value = ws.Range("B4").Value & " m³/s"
    reportWs.Range("A10").Value = "Pipe Length:"
    reportWs.Range("B10").Value = ws.Range("B5").Value & " m"
    reportWs.Range("A11").Value = "Fluid:"
    reportWs.Range("B11").Value = "Water (ρ=" & ws.Range("B6").Value & " kg/m³, μ=" & ws.Range("B7").Value & " Pa·s)"
    reportWs.Range("A12").Value = "Max Pressure Drop:"
    reportWs.Range("B12").Value = ws.Range("B8").Value & " Pa"
    reportWs.Range("A13").Value = "Max Velocity:"
    reportWs.Range("B13").Value = ws.Range("B9").Value & " m/s"
    
    ' Results
    reportWs.Range("A15").Value = "DESIGN RESULTS"
    reportWs.Range("A15").Font.Bold = True
    reportWs.Range("A16").Value = "Recommended Diameter:"
    reportWs.Range("B16").Value = ws.Range("B16").Value & " m"
    reportWs.Range("A17").Value = "Standard Size:"
    reportWs.Range("B17").Value = ws.Range("B17").Value & " m"
    reportWs.Range("A18").Value = "Selected Diameter:"
    reportWs.Range("B18").Value = ws.Range("B18").Value & " m"
    reportWs.Range("A19").Value = "Final Pressure Drop:"
    reportWs.Range("B19").Value = ws.Range("B19").Value & " Pa (" & Format(ws.Range("B19").Value / 1000, "0.0") & " kPa)"
    reportWs.Range("A20").Value = "Final Velocity:"
    reportWs.Range("B20").Value = ws.Range("B20").Value & " m/s"
    
    ' Copy analysis table
    reportWs.Range("D8").Value = "DIAMETER ANALYSIS"
    reportWs.Range("D8").Font.Bold = True
    ws.Range("D4:J12").Copy
    reportWs.Range("D9").PasteSpecial xlPasteAll
    
    ' Add validation
    reportWs.Range("A22").Value = "VALIDATION"
    reportWs.Range("A22").Font.Bold = True
    
    Dim finalVelocity As Double, finalPressureDrop As Double
    finalVelocity = ws.Range("B20").Value
    finalPressureDrop = ws.Range("B19").Value
    
    If finalVelocity <= ws.Range("B9").Value And finalPressureDrop <= ws.Range("B8").Value Then
        reportWs.Range("A23").Value = "✓ Design meets all requirements"
        reportWs.Range("A23").Interior.Color = RGB(200, 255, 200)
    Else
        reportWs.Range("A23").Value = "⚠ Design exceeds limits - review requirements"
        reportWs.Range("A23").Interior.Color = RGB(255, 255, 200)
    End If
    
    ' Format report
    reportWs.Columns("A:F").AutoFit
    reportWs.Range("A1:F25").Borders.LineStyle = xlContinuous
    
    reportWs.Activate
    MsgBox "Pipe sizing report generated successfully!", vbInformation, "EngiVault Report"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error generating pipe report: " & Err.Description, vbCritical, "EngiVault Report"
End Sub

'===============================================================================
' DATA VALIDATION AND ERROR PREVENTION
'===============================================================================

Public Sub AddDataValidation(targetRange As Range, validationType As String)
    '
    ' Add data validation to prevent invalid inputs
    '
    ' Parameters:
    '   targetRange: Range to add validation to
    '   validationType: Type of validation ("positive", "flow_rate", "temperature", "pressure")
    '
    On Error GoTo ErrorHandler
    
    With targetRange.Validation
        .Delete ' Clear existing validation
        
        Select Case LCase(validationType)
            Case "positive"
                .Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertStop, _
                     Operator:=xlGreater, Formula1:="0"
                .ErrorMessage = "Value must be greater than 0"
                
            Case "flow_rate"
                .Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertStop, _
                     Operator:=xlBetween, Formula1:="0.001", Formula2:="100"
                .ErrorMessage = "Flow rate must be between 0.001 and 100 m³/s"
                
            Case "temperature"
                .Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertStop, _
                     Operator:=xlBetween, Formula1:="0", Formula2:="1000"
                .ErrorMessage = "Temperature must be between 0 and 1000 K"
                
            Case "pressure"
                .Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertStop, _
                     Operator:=xlBetween, Formula1:="1000", Formula2:="100000000"
                .ErrorMessage = "Pressure must be between 1 kPa and 100 MPa"
                
            Case "manning"
                .Add Type:=xlValidateDecimal, AlertStyle:=xlValidAlertStop, _
                     Operator:=xlBetween, Formula1:="0.01", Formula2:="0.1"
                .ErrorMessage = "Manning's coefficient must be between 0.01 and 0.1"
        End Select
        
        .ErrorTitle = "EngiVault Input Validation"
        .ShowError = True
    End With
    
    Exit Sub
    
ErrorHandler:
    Debug.Print "Error adding data validation: " & Err.Description
End Sub

Public Sub SetupTemplateValidation()
    '
    ' Set up data validation for active template
    '
    On Error Resume Next
    
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    ' Add validation based on worksheet name
    If InStr(ws.Name, "Pipe") > 0 Then
        Call AddDataValidation(ws.Range("B4"), "flow_rate")      ' Flow rate
        Call AddDataValidation(ws.Range("B5"), "positive")       ' Length
        Call AddDataValidation(ws.Range("B6"), "positive")       ' Density
        Call AddDataValidation(ws.Range("B7"), "positive")       ' Viscosity
        Call AddDataValidation(ws.Range("B8"), "pressure")       ' Max pressure drop
        Call AddDataValidation(ws.Range("B9"), "positive")       ' Max velocity
        
    ElseIf InStr(ws.Name, "Heat") > 0 Then
        Call AddDataValidation(ws.Range("B4"), "positive")       ' Heat duty
        Call AddDataValidation(ws.Range("B5:B8"), "temperature") ' Temperatures
        
    ElseIf InStr(ws.Name, "Fluid") > 0 Then
        Call AddDataValidation(ws.Range("B4"), "flow_rate")      ' Flow rate
        Call AddDataValidation(ws.Range("B5"), "positive")       ' Width
        Call AddDataValidation(ws.Range("B6"), "positive")       ' Slope
        Call AddDataValidation(ws.Range("B7"), "manning")        ' Manning's n
        Call AddDataValidation(ws.Range("H4"), "positive")       ' Velocity
        Call AddDataValidation(ws.Range("H5"), "temperature")    ' Temperature
        Call AddDataValidation(ws.Range("H6"), "pressure")       ' Pressure
    End If
    
    MsgBox "Data validation added to template inputs!", vbInformation, "EngiVault Validation"
End Sub
