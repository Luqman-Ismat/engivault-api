Attribute VB_Name = "EngiVaultCharts"
'===============================================================================
' EngiVault Excel Integration - Advanced Charts and Visualization
' VBA Module for Automatic Chart Generation and Data Visualization
'
' Version: 1.3.0
' Author: Luqman Ismat
'===============================================================================

Option Explicit

'===============================================================================
' SYSTEM CURVE GENERATION
'===============================================================================

Public Sub CreateSystemCurve( _
    flowRateRange As Range, _
    pipeData As Range, _
    Optional chartTitle As String = "System Curve Analysis" _
)
    '
    ' Create system curve chart showing pressure drop vs flow rate
    '
    ' Parameters:
    '   flowRateRange: Range containing flow rates (m³/s)
    '   pipeData: Range with pipe parameters [diameter, length, density, viscosity]
    '   chartTitle: Chart title
    '
    ' Usage: Call CreateSystemCurve(Range("A2:A11"), Range("B2:E2"))
    '
    
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim chart As ChartObject
    Dim i As Long
    Dim flowRate As Double
    Dim pressureDrop As Double
    Dim dataRange As Range
    
    Set ws = ActiveSheet
    
    ' Create data table for system curve
    Dim startRow As Long
    startRow = flowRateRange.Row + flowRateRange.Rows.Count + 2
    
    ' Headers
    ws.Cells(startRow, 1).Value = "Flow Rate (m³/s)"
    ws.Cells(startRow, 2).Value = "Pressure Drop (Pa)"
    ws.Cells(startRow, 3).Value = "Pressure Drop (kPa)"
    
    ' Calculate pressure drop for each flow rate
    For i = 1 To flowRateRange.Rows.Count
        flowRate = flowRateRange.Cells(i, 1).Value
        
        If flowRate > 0 Then
            pressureDrop = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_PRESSURE_DROP(" & flowRate & "," & _
                pipeData.Cells(1, 1).Value & "," & _
                pipeData.Cells(1, 2).Value & "," & _
                pipeData.Cells(1, 3).Value & "," & _
                pipeData.Cells(1, 4).Value & ")")
            
            ws.Cells(startRow + i, 1).Value = flowRate
            ws.Cells(startRow + i, 2).Value = pressureDrop
            ws.Cells(startRow + i, 3).Value = pressureDrop / 1000
        End If
    Next i
    
    ' Create chart
    Set dataRange = ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + flowRateRange.Rows.Count, 3))
    Set chart = ws.ChartObjects.Add(Left:=300, Top:=50, Width:=500, Height:=350)
    
    With chart.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlXYScatterSmoothNoMarkers
        .HasTitle = True
        .ChartTitle.Text = chartTitle
        
        ' Format axes
        .Axes(xlCategory).HasTitle = True
        .Axes(xlCategory).AxisTitle.Text = "Flow Rate (m³/s)"
        .Axes(xlValue).HasTitle = True
        .Axes(xlValue).AxisTitle.Text = "Pressure Drop (kPa)"
        
        ' Format series
        .SeriesCollection(1).Name = "System Curve"
        .SeriesCollection(1).Border.Color = RGB(0, 100, 200)
        .SeriesCollection(1).Border.Weight = 3
        
        ' Add gridlines
        .Axes(xlCategory).HasMajorGridlines = True
        .Axes(xlValue).HasMajorGridlines = True
        
        ' Format legend
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
    End With
    
    MsgBox "System curve chart created successfully!", vbInformation, "EngiVault Charts"
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating system curve: " & Err.Description, vbCritical, "EngiVault Charts"
End Sub

Public Sub CreatePumpPerformanceCurve( _
    flowRateRange As Range, _
    pumpData As Range, _
    Optional chartTitle As String = "Pump Performance Curve" _
)
    '
    ' Create pump performance curve showing head vs flow rate
    '
    ' Parameters:
    '   flowRateRange: Range containing flow rates (m³/s)
    '   pumpData: Range with pump parameters [max_head, max_flow, efficiency, power]
    '   chartTitle: Chart title
    '
    ' Usage: Call CreatePumpPerformanceCurve(Range("A2:A11"), Range("F2:I2"))
    '
    
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim chart As ChartObject
    Dim i As Long
    Dim flowRate As Double
    Dim head As Double, efficiency As Double, power As Double
    Dim dataRange As Range
    
    Set ws = ActiveSheet
    
    ' Create data table for pump curve
    Dim startRow As Long
    startRow = flowRateRange.Row + flowRateRange.Rows.Count + 2
    
    ' Headers
    ws.Cells(startRow, 5).Value = "Flow Rate (m³/s)"
    ws.Cells(startRow, 6).Value = "Head (m)"
    ws.Cells(startRow, 7).Value = "Efficiency (%)"
    ws.Cells(startRow, 8).Value = "Power (kW)"
    
    ' Calculate pump performance for each flow rate
    Dim maxFlow As Double, maxHead As Double
    maxFlow = pumpData.Cells(1, 2).Value
    maxHead = pumpData.Cells(1, 1).Value
    
    For i = 1 To flowRateRange.Rows.Count
        flowRate = flowRateRange.Cells(i, 1).Value
        
        If flowRate > 0 And flowRate <= maxFlow Then
            ' Simplified pump curve (parabolic approximation)
            head = maxHead * (1 - (flowRate / maxFlow) ^ 2)
            efficiency = 0.8 * (1 - 0.5 * Abs(flowRate - maxFlow * 0.7) / (maxFlow * 0.7))
            
            ' Calculate power using EngiVault function
            power = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_PUMP_POWER(" & flowRate & "," & head & "," & efficiency & "," & _
                pumpData.Cells(1, 4).Value & ")")
            
            ws.Cells(startRow + i, 5).Value = flowRate
            ws.Cells(startRow + i, 6).Value = head
            ws.Cells(startRow + i, 7).Value = efficiency * 100
            ws.Cells(startRow + i, 8).Value = power
        End If
    Next i
    
    ' Create chart with multiple series
    Set dataRange = ws.Range(ws.Cells(startRow, 5), ws.Cells(startRow + flowRateRange.Rows.Count, 8))
    Set chart = ws.ChartObjects.Add(Left:=300, Top:=420, Width:=500, Height:=350)
    
    With chart.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlXYScatterSmoothNoMarkers
        .HasTitle = True
        .ChartTitle.Text = chartTitle
        
        ' Format primary axis (Head)
        .Axes(xlCategory).HasTitle = True
        .Axes(xlCategory).AxisTitle.Text = "Flow Rate (m³/s)"
        .Axes(xlValue).HasTitle = True
        .Axes(xlValue).AxisTitle.Text = "Head (m)"
        
        ' Add secondary axis for efficiency
        .SeriesCollection(2).AxisGroup = xlSecondary
        .Axes(xlValue, xlSecondary).HasTitle = True
        .Axes(xlValue, xlSecondary).AxisTitle.Text = "Efficiency (%)"
        
        ' Format series
        .SeriesCollection(1).Name = "Head Curve"
        .SeriesCollection(1).Border.Color = RGB(200, 0, 0)
        .SeriesCollection(1).Border.Weight = 3
        
        .SeriesCollection(2).Name = "Efficiency"
        .SeriesCollection(2).Border.Color = RGB(0, 150, 0)
        .SeriesCollection(2).Border.Weight = 2
        
        .SeriesCollection(3).Name = "Power"
        .SeriesCollection(3).Border.Color = RGB(0, 0, 200)
        .SeriesCollection(3).Border.Weight = 2
        
        ' Add gridlines
        .Axes(xlCategory).HasMajorGridlines = True
        .Axes(xlValue).HasMajorGridlines = True
        
        ' Format legend
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
    End With
    
    MsgBox "Pump performance curve created successfully!", vbInformation, "EngiVault Charts"
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating pump curve: " & Err.Description, vbCritical, "EngiVault Charts"
End Sub

Public Sub CreateHeatExchangerChart( _
    ntuRange As Range, _
    capacityRatios As Range, _
    Optional chartTitle As String = "Heat Exchanger Effectiveness Chart" _
)
    '
    ' Create effectiveness vs NTU chart for different capacity ratios
    '
    ' Parameters:
    '   ntuRange: Range containing NTU values (0-5)
    '   capacityRatios: Range containing capacity ratios (0-1)
    '   chartTitle: Chart title
    '
    ' Usage: Call CreateHeatExchangerChart(Range("A2:A21"), Range("B1:E1"))
    '
    
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim chart As ChartObject
    Dim i As Long, j As Long
    Dim ntu As Double, capacityRatio As Double
    Dim effectiveness As Double
    Dim dataRange As Range
    
    Set ws = ActiveSheet
    
    ' Create effectiveness data table
    Dim startRow As Long, startCol As Long
    startRow = ntuRange.Row + ntuRange.Rows.Count + 2
    startCol = 10 ' Column J
    
    ' Headers
    ws.Cells(startRow, startCol).Value = "NTU"
    For j = 1 To capacityRatios.Columns.Count
        ws.Cells(startRow, startCol + j).Value = "C* = " & capacityRatios.Cells(1, j).Value
    Next j
    
    ' Calculate effectiveness for each NTU and capacity ratio
    For i = 1 To ntuRange.Rows.Count
        ntu = ntuRange.Cells(i, 1).Value
        ws.Cells(startRow + i, startCol).Value = ntu
        
        For j = 1 To capacityRatios.Columns.Count
            capacityRatio = capacityRatios.Cells(1, j).Value
            
            effectiveness = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_EFFECTIVENESS(" & ntu & "," & capacityRatio & ",""counterflow"")")
            
            ws.Cells(startRow + i, startCol + j).Value = effectiveness
        Next j
    Next i
    
    ' Create chart
    Set dataRange = ws.Range(ws.Cells(startRow, startCol), ws.Cells(startRow + ntuRange.Rows.Count, startCol + capacityRatios.Columns.Count))
    Set chart = ws.ChartObjects.Add(Left:=50, Top:=50, Width:=600, Height:=400)
    
    With chart.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlXYScatterSmoothNoMarkers
        .HasTitle = True
        .ChartTitle.Text = chartTitle
        
        ' Format axes
        .Axes(xlCategory).HasTitle = True
        .Axes(xlCategory).AxisTitle.Text = "Number of Transfer Units (NTU)"
        .Axes(xlValue).HasTitle = True
        .Axes(xlValue).AxisTitle.Text = "Effectiveness"
        .Axes(xlValue).MinimumScale = 0
        .Axes(xlValue).MaximumScale = 1
        
        ' Format series with different colors
        Dim colors As Variant
        colors = Array(RGB(255, 0, 0), RGB(0, 150, 0), RGB(0, 0, 255), RGB(255, 150, 0), RGB(150, 0, 150))
        
        For j = 1 To .SeriesCollection.Count
            .SeriesCollection(j).Border.Color = colors((j - 1) Mod 5)
            .SeriesCollection(j).Border.Weight = 2
        Next j
        
        ' Add gridlines
        .Axes(xlCategory).HasMajorGridlines = True
        .Axes(xlValue).HasMajorGridlines = True
        
        ' Format legend
        .HasLegend = True
        .Legend.Position = xlLegendPositionRight
    End With
    
    MsgBox "Heat exchanger effectiveness chart created successfully!", vbInformation, "EngiVault Charts"
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating heat exchanger chart: " & Err.Description, vbCritical, "EngiVault Charts"
End Sub

Public Sub CreateOpenChannelChart( _
    flowRateRange As Range, _
    channelData As Range, _
    Optional chartTitle As String = "Open Channel Flow Analysis" _
)
    '
    ' Create open channel flow chart showing depth vs flow rate
    '
    ' Parameters:
    '   flowRateRange: Range containing flow rates (m³/s)
    '   channelData: Range with channel parameters [width, slope, manning_n]
    '   chartTitle: Chart title
    '
    ' Usage: Call CreateOpenChannelChart(Range("A2:A11"), Range("B2:D2"))
    '
    
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim chart As ChartObject
    Dim i As Long
    Dim flowRate As Double
    Dim normalDepth As Double, criticalDepth As Double
    Dim velocity As Double, froudeNumber As Double
    Dim dataRange As Range
    
    Set ws = ActiveSheet
    
    ' Create data table
    Dim startRow As Long
    startRow = flowRateRange.Row + flowRateRange.Rows.Count + 2
    
    ' Headers
    ws.Cells(startRow, 1).Value = "Flow Rate (m³/s)"
    ws.Cells(startRow, 2).Value = "Normal Depth (m)"
    ws.Cells(startRow, 3).Value = "Critical Depth (m)"
    ws.Cells(startRow, 4).Value = "Velocity (m/s)"
    ws.Cells(startRow, 5).Value = "Froude Number"
    
    ' Calculate for each flow rate
    For i = 1 To flowRateRange.Rows.Count
        flowRate = flowRateRange.Cells(i, 1).Value
        
        If flowRate > 0 Then
            normalDepth = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_MANNING_FLOW(" & flowRate & "," & _
                channelData.Cells(1, 1).Value & "," & _
                channelData.Cells(1, 2).Value & "," & _
                channelData.Cells(1, 3).Value & ",""rectangular"")")
            
            criticalDepth = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_CRITICAL_DEPTH(" & flowRate & "," & _
                channelData.Cells(1, 1).Value & ",""rectangular"")")
            
            velocity = flowRate / (channelData.Cells(1, 1).Value * normalDepth)
            froudeNumber = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_FROUDE_NUMBER(" & velocity & "," & normalDepth & ")")
            
            ws.Cells(startRow + i, 1).Value = flowRate
            ws.Cells(startRow + i, 2).Value = normalDepth
            ws.Cells(startRow + i, 3).Value = criticalDepth
            ws.Cells(startRow + i, 4).Value = velocity
            ws.Cells(startRow + i, 5).Value = froudeNumber
        End If
    Next i
    
    ' Create chart
    Set dataRange = ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + flowRateRange.Rows.Count, 3))
    Set chart = ws.ChartObjects.Add(Left:=50, Top:=450, Width:=500, Height:=350)
    
    With chart.Chart
        .SetSourceData Source:=dataRange
        .ChartType = xlXYScatterSmoothNoMarkers
        .HasTitle = True
        .ChartTitle.Text = chartTitle
        
        ' Format axes
        .Axes(xlCategory).HasTitle = True
        .Axes(xlCategory).AxisTitle.Text = "Flow Rate (m³/s)"
        .Axes(xlValue).HasTitle = True
        .Axes(xlValue).AxisTitle.Text = "Depth (m)"
        
        ' Format series
        .SeriesCollection(1).Name = "Normal Depth"
        .SeriesCollection(1).Border.Color = RGB(0, 100, 200)
        .SeriesCollection(1).Border.Weight = 3
        
        .SeriesCollection(2).Name = "Critical Depth"
        .SeriesCollection(2).Border.Color = RGB(200, 0, 0)
        .SeriesCollection(2).Border.Weight = 2
        .SeriesCollection(2).Border.LineStyle = xlDash
        
        ' Add gridlines
        .Axes(xlCategory).HasMajorGridlines = True
        .Axes(xlValue).HasMajorGridlines = True
        
        ' Format legend
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
    End With
    
    MsgBox "Open channel flow chart created successfully!", vbInformation, "EngiVault Charts"
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating open channel chart: " & Err.Description, vbCritical, "EngiVault Charts"
End Sub

'===============================================================================
' BATCH PROCESSING FUNCTIONS
'===============================================================================

Public Sub BatchPressureDropAnalysis( _
    inputRange As Range, _
    outputRange As Range _
)
    '
    ' Batch process multiple pressure drop calculations
    '
    ' Parameters:
    '   inputRange: Range with columns [Flow, Diameter, Length, Density, Viscosity]
    '   outputRange: Range for results [Pressure Drop, Velocity, Reynolds, Status]
    '
    ' Usage: Call BatchPressureDropAnalysis(Range("A2:E11"), Range("F2:I11"))
    '
    
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    Dim i As Long
    Dim flowRate As Double, diameter As Double, length As Double
    Dim density As Double, viscosity As Double
    Dim pressureDrop As Double, velocity As Double, reynolds As Double
    Dim status As String
    
    ' Headers
    outputRange.Cells(0, 1).Value = "Pressure Drop (Pa)"
    outputRange.Cells(0, 2).Value = "Velocity (m/s)"
    outputRange.Cells(0, 3).Value = "Reynolds Number"
    outputRange.Cells(0, 4).Value = "Status"
    
    ' Process each row
    For i = 1 To inputRange.Rows.Count
        ' Get input parameters
        flowRate = inputRange.Cells(i, 1).Value
        diameter = inputRange.Cells(i, 2).Value
        length = inputRange.Cells(i, 3).Value
        density = inputRange.Cells(i, 4).Value
        viscosity = inputRange.Cells(i, 5).Value
        
        ' Validate inputs
        If flowRate > 0 And diameter > 0 And length > 0 And density > 0 And viscosity > 0 Then
            ' Calculate using EngiVault functions
            pressureDrop = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_PRESSURE_DROP(" & flowRate & "," & diameter & "," & length & "," & density & "," & viscosity & ")")
            
            velocity = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_PIPE_VELOCITY(" & flowRate & "," & diameter & ")")
            
            reynolds = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_REYNOLDS_NUMBER(" & flowRate & "," & diameter & "," & density & "," & viscosity & ")")
            
            ' Determine status
            If velocity < 3 And pressureDrop < 100000 Then
                status = "✓ Good"
            ElseIf velocity < 5 And pressureDrop < 200000 Then
                status = "⚠ Acceptable"
            Else
                status = "✗ Poor"
            End If
            
            ' Write results
            outputRange.Cells(i, 1).Value = pressureDrop
            outputRange.Cells(i, 2).Value = velocity
            outputRange.Cells(i, 3).Value = reynolds
            outputRange.Cells(i, 4).Value = status
        Else
            ' Invalid inputs
            outputRange.Cells(i, 1).Value = "Invalid"
            outputRange.Cells(i, 2).Value = "Invalid"
            outputRange.Cells(i, 3).Value = "Invalid"
            outputRange.Cells(i, 4).Value = "✗ Invalid inputs"
        End If
    Next i
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    
    MsgBox "Batch pressure drop analysis completed for " & inputRange.Rows.Count & " cases!", vbInformation, "EngiVault Batch Processing"
    Exit Sub
    
ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "Error in batch processing: " & Err.Description, vbCritical, "EngiVault Batch Processing"
End Sub

Public Sub BatchHeatExchangerSizing( _
    inputRange As Range, _
    outputRange As Range _
)
    '
    ' Batch process multiple heat exchanger sizing calculations
    '
    ' Parameters:
    '   inputRange: Range with columns [Heat Duty, Overall U, T_hot_in, T_hot_out, T_cold_in, T_cold_out]
    '   outputRange: Range for results [Area, LMTD, Effectiveness, Cost]
    '
    ' Usage: Call BatchHeatExchangerSizing(Range("A2:F11"), Range("G2:J11"))
    '
    
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    Dim i As Long
    Dim heatDuty As Double, overallU As Double
    Dim tHotIn As Double, tHotOut As Double, tColdIn As Double, tColdOut As Double
    Dim area As Double, lmtd As Double, effectiveness As Double, cost As Double
    
    ' Headers
    outputRange.Cells(0, 1).Value = "Area (m²)"
    outputRange.Cells(0, 2).Value = "LMTD (K)"
    outputRange.Cells(0, 3).Value = "Effectiveness"
    outputRange.Cells(0, 4).Value = "Cost ($)"
    
    ' Process each row
    For i = 1 To inputRange.Rows.Count
        ' Get input parameters
        heatDuty = inputRange.Cells(i, 1).Value
        overallU = inputRange.Cells(i, 2).Value
        tHotIn = inputRange.Cells(i, 3).Value
        tHotOut = inputRange.Cells(i, 4).Value
        tColdIn = inputRange.Cells(i, 5).Value
        tColdOut = inputRange.Cells(i, 6).Value
        
        ' Validate inputs
        If heatDuty > 0 And overallU > 0 And tHotIn > tHotOut And tColdOut > tColdIn Then
            ' Calculate using EngiVault functions
            area = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_HEAT_EXCHANGER_AREA(" & heatDuty & "," & overallU & "," & _
                (tHotIn + 273.15) & "," & (tHotOut + 273.15) & "," & _
                (tColdIn + 273.15) & "," & (tColdOut + 273.15) & ",""counterflow"")")
            
            lmtd = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_LMTD(" & (tHotIn + 273.15) & "," & (tHotOut + 273.15) & "," & _
                (tColdIn + 273.15) & "," & (tColdOut + 273.15) & ",""counterflow"")")
            
            effectiveness = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_EFFECTIVENESS(" & (overallU * area) / 1000 & ",0.8,""counterflow"")")  ' Simplified
            
            cost = Application.WorksheetFunction.Evaluate( _
                "HEAT_EXCHANGER_COST_ESTIMATE(" & area & ",""stainless_steel"",10)")
            
            ' Write results
            outputRange.Cells(i, 1).Value = area
            outputRange.Cells(i, 2).Value = lmtd
            outputRange.Cells(i, 3).Value = effectiveness
            outputRange.Cells(i, 4).Value = cost
        Else
            ' Invalid inputs
            outputRange.Cells(i, 1).Value = "Invalid"
            outputRange.Cells(i, 2).Value = "Invalid"
            outputRange.Cells(i, 3).Value = "Invalid"
            outputRange.Cells(i, 4).Value = "Invalid"
        End If
    Next i
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    
    MsgBox "Batch heat exchanger sizing completed for " & inputRange.Rows.Count & " cases!", vbInformation, "EngiVault Batch Processing"
    Exit Sub
    
ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "Error in batch heat exchanger processing: " & Err.Description, vbCritical, "EngiVault Batch Processing"
End Sub

'===============================================================================
' DASHBOARD CREATION
'===============================================================================

Public Sub CreateEngineeringDashboard()
    '
    ' Create comprehensive engineering dashboard with key calculations
    '
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim dashboardName As String
    
    dashboardName = "EngiVault Dashboard"
    
    ' Create or activate dashboard worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets(dashboardName)
    On Error GoTo ErrorHandler
    
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add
        ws.Name = dashboardName
    Else
        ws.Activate
        ws.Cells.Clear
    End If
    
    ' Dashboard title
    With ws.Range("A1:H1")
        .Merge
        .Value = "EngiVault Engineering Dashboard"
        .Font.Size = 20
        .Font.Bold = True
        .HorizontalAlignment = xlCenter
        .Interior.Color = RGB(0, 100, 200)
        .Font.Color = RGB(255, 255, 255)
    End With
    
    ' Hydraulics section
    ws.Range("A3").Value = "HYDRAULICS"
    ws.Range("A3").Font.Bold = True
    ws.Range("A3").Interior.Color = RGB(200, 230, 255)
    
    ws.Range("A4").Value = "Flow Rate (m³/s):"
    ws.Range("B4").Value = 0.1
    ws.Range("A5").Value = "Pipe Diameter (m):"
    ws.Range("B5").Value = 0.1
    ws.Range("A6").Value = "Pipe Length (m):"
    ws.Range("B6").Value = 100
    ws.Range("A7").Value = "Fluid Density (kg/m³):"
    ws.Range("B7").Value = 1000
    ws.Range("A8").Value = "Fluid Viscosity (Pa·s):"
    ws.Range("B8").Value = 0.001
    
    ws.Range("D4").Value = "Pressure Drop (Pa):"
    ws.Range("E4").Value = "=ENGIVAULT_PRESSURE_DROP(B4,B5,B6,B7,B8)"
    ws.Range("D5").Value = "Velocity (m/s):"
    ws.Range("E5").Value = "=ENGIVAULT_PIPE_VELOCITY(B4,B5)"
    ws.Range("D6").Value = "Reynolds Number:"
    ws.Range("E6").Value = "=ENGIVAULT_REYNOLDS_NUMBER(B4,B5,B7,B8)"
    ws.Range("D7").Value = "Flow Regime:"
    ws.Range("E7").Value = "=VALIDATE_FLOW_REGIME(E6)"
    
    ' Heat Transfer section
    ws.Range("A10").Value = "HEAT TRANSFER"
    ws.Range("A10").Font.Bold = True
    ws.Range("A10").Interior.Color = RGB(255, 230, 200)
    
    ws.Range("A11").Value = "Heat Duty (W):"
    ws.Range("B11").Value = 50000
    ws.Range("A12").Value = "Overall U (W/m²·K):"
    ws.Range("B12").Value = 500
    ws.Range("A13").Value = "Hot Inlet (°C):"
    ws.Range("B13").Value = 80
    ws.Range("A14").Value = "Hot Outlet (°C):"
    ws.Range("B14").Value = 60
    ws.Range("A15").Value = "Cold Inlet (°C):"
    ws.Range("B15").Value = 20
    ws.Range("A16").Value = "Cold Outlet (°C):"
    ws.Range("B16").Value = 40
    
    ws.Range("D11").Value = "LMTD (K):"
    ws.Range("E11").Value = "=ENGIVAULT_LMTD(CELSIUS_TO_KELVIN(B13),CELSIUS_TO_KELVIN(B14),CELSIUS_TO_KELVIN(B15),CELSIUS_TO_KELVIN(B16))"
    ws.Range("D12").Value = "Area Required (m²):"
    ws.Range("E12").Value = "=ENGIVAULT_HEAT_EXCHANGER_AREA(B11,B12,CELSIUS_TO_KELVIN(B13),CELSIUS_TO_KELVIN(B14),CELSIUS_TO_KELVIN(B15),CELSIUS_TO_KELVIN(B16))"
    ws.Range("D13").Value = "Estimated Cost ($):"
    ws.Range("E13").Value = "=HEAT_EXCHANGER_COST_ESTIMATE(E12,""stainless_steel"",10)"
    
    ' Fluid Mechanics section
    ws.Range("A18").Value = "FLUID MECHANICS"
    ws.Range("A18").Font.Bold = True
    ws.Range("A18").Interior.Color = RGB(200, 255, 200)
    
    ws.Range("A19").Value = "Channel Flow (m³/s):"
    ws.Range("B19").Value = 5
    ws.Range("A20").Value = "Channel Width (m):"
    ws.Range("B20").Value = 3
    ws.Range("A21").Value = "Channel Slope:"
    ws.Range("B21").Value = 0.001
    ws.Range("A22").Value = "Manning's n:"
    ws.Range("B22").Value = 0.03
    
    ws.Range("D19").Value = "Normal Depth (m):"
    ws.Range("E19").Value = "=ENGIVAULT_MANNING_FLOW(B19,B20,B21,B22)"
    ws.Range("D20").Value = "Critical Depth (m):"
    ws.Range("E20").Value = "=ENGIVAULT_CRITICAL_DEPTH(B19,B20)"
    ws.Range("D21").Value = "Froude Number:"
    ws.Range("E21").Value = "=ENGIVAULT_FROUDE_NUMBER(B19/(B20*E19),E19)"
    ws.Range("D22").Value = "Flow Regime:"
    ws.Range("E22").Value = "=IF(E21<1,""Subcritical"",""Supercritical"")"
    
    ' API Status section
    ws.Range("G3").Value = "SYSTEM STATUS"
    ws.Range("G3").Font.Bold = True
    ws.Range("G3").Interior.Color = RGB(230, 230, 230)
    
    ws.Range("G4").Value = "API Status:"
    ws.Range("H4").Value = "=ENGIVAULT_API_STATUS()"
    ws.Range("G5").Value = "Version:"
    ws.Range("H5").Value = "=ENGIVAULT_VERSION()"
    ws.Range("G6").Value = "Last Updated:"
    ws.Range("H6").Value = "=NOW()"
    
    ' Format dashboard
    ws.Columns("A:H").AutoFit
    ws.Range("A1:H25").Borders.LineStyle = xlContinuous
    
    ' Add refresh button
    Dim btn As Button
    Set btn = ws.Buttons.Add(450, 150, 100, 30)
    btn.Text = "Refresh All"
    btn.OnAction = "RefreshDashboard"
    
    ws.Activate
    MsgBox "Engineering dashboard created successfully!" & vbCrLf & _
           "Use the dashboard to perform quick calculations and monitor system status.", _
           vbInformation, "EngiVault Dashboard"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error creating dashboard: " & Err.Description, vbCritical, "EngiVault Dashboard"
End Sub

Public Sub RefreshDashboard()
    '
    ' Refresh all calculations in the dashboard
    '
    On Error GoTo ErrorHandler
    
    Application.ScreenUpdating = False
    
    ' Force recalculation
    Application.Calculate
    
    ' Update timestamp
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("EngiVault Dashboard")
    ws.Range("H6").Value = Now()
    
    Application.ScreenUpdating = True
    
    MsgBox "Dashboard refreshed successfully!", vbInformation, "EngiVault Dashboard"
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    MsgBox "Error refreshing dashboard: " & Err.Description, vbCritical, "EngiVault Dashboard"
End Sub

'===============================================================================
' PERFORMANCE OPTIMIZATION
'===============================================================================

Public Sub OptimizePipeSize( _
    targetPressureDrop As Double, _
    pipeParameters As Range, _
    diameterRange As Range _
)
    '
    ' Optimize pipe size to meet pressure drop target
    '
    ' Parameters:
    '   targetPressureDrop: Target pressure drop in Pa
    '   pipeParameters: Range with [Flow, Length, Density, Viscosity]
    '   diameterRange: Range with diameter options to test
    '
    ' Usage: Call OptimizePipeSize(50000, Range("B4:E4"), Range("A10:A15"))
    '
    
    On Error GoTo ErrorHandler
    
    Dim ws As Worksheet
    Dim i As Long
    Dim diameter As Double, pressureDrop As Double
    Dim bestDiameter As Double, bestPressureDrop As Double
    Dim minError As Double
    
    Set ws = ActiveSheet
    minError = 1E+20
    
    ' Test each diameter
    For i = 1 To diameterRange.Rows.Count
        diameter = diameterRange.Cells(i, 1).Value
        
        If diameter > 0 Then
            pressureDrop = Application.WorksheetFunction.Evaluate( _
                "ENGIVAULT_PRESSURE_DROP(" & pipeParameters.Cells(1, 1).Value & "," & _
                diameter & "," & pipeParameters.Cells(1, 2).Value & "," & _
                pipeParameters.Cells(1, 3).Value & "," & pipeParameters.Cells(1, 4).Value & ")")
            
            ' Check if this is closest to target
            If Abs(pressureDrop - targetPressureDrop) < minError Then
                minError = Abs(pressureDrop - targetPressureDrop)
                bestDiameter = diameter
                bestPressureDrop = pressureDrop
            End If
        End If
    Next i
    
    ' Display results
    MsgBox "Pipe Size Optimization Results:" & vbCrLf & vbCrLf & _
           "Target Pressure Drop: " & Format(targetPressureDrop, "#,##0") & " Pa" & vbCrLf & _
           "Optimal Diameter: " & bestDiameter & " m" & vbCrLf & _
           "Actual Pressure Drop: " & Format(bestPressureDrop, "#,##0") & " Pa" & vbCrLf & _
           "Error: " & Format(Abs(bestPressureDrop - targetPressureDrop), "#,##0") & " Pa (" & _
           Format(Abs(bestPressureDrop - targetPressureDrop) / targetPressureDrop * 100, "0.0") & "%)", _
           vbInformation, "EngiVault Optimization"
    
    Exit Sub
    
ErrorHandler:
    MsgBox "Error in pipe size optimization: " & Err.Description, vbCritical, "EngiVault Optimization"
End Sub
