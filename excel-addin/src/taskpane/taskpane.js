/**
 * EngiVault Task Pane
 * Provides UI for configuration and quick calculations
 */

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    document.getElementById('save-key').onclick = saveApiKey;
    document.getElementById('calc-pressure').onclick = calculatePressureDrop;
    document.getElementById('calc-pump').onclick = calculatePumpPower;
    document.getElementById('calc-heat').onclick = calculateLMTD;
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });
    
    // Load saved API key
    loadApiKey();
  }
});

/**
 * Save API key to storage
 */
async function saveApiKey() {
  const apiKey = document.getElementById('api-key').value.trim();
  const statusDiv = document.getElementById('config-status');
  
  if (!apiKey) {
    showStatus(statusDiv, 'Please enter an API key', 'error');
    return;
  }
  
  try {
    await OfficeRuntime.storage.setItem('ENGIVAULT_API_KEY', apiKey);
    showStatus(statusDiv, 'API key saved successfully!', 'success');
    document.getElementById('api-key').value = '';
  } catch (error) {
    showStatus(statusDiv, 'Failed to save API key: ' + error.message, 'error');
  }
}

/**
 * Load saved API key
 */
async function loadApiKey() {
  try {
    const apiKey = await OfficeRuntime.storage.getItem('ENGIVAULT_API_KEY');
    if (apiKey) {
      document.getElementById('config-status').innerHTML = 
        '<span class="status-success">✓ API key configured</span>';
    }
  } catch (error) {
    console.error('Failed to load API key:', error);
  }
}

/**
 * Switch between calculator tabs
 */
function switchTab(tabName) {
  // Update button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update content visibility
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabName + '-tab').classList.add('active');
}

/**
 * Calculate pressure drop
 */
async function calculatePressureDrop() {
  const resultDiv = document.getElementById('pressure-result');
  resultDiv.innerHTML = '<div class="loading">Calculating...</div>';
  
  try {
    const flowRate = parseFloat(document.getElementById('pd-flow').value);
    const diameter = parseFloat(document.getElementById('pd-diameter').value);
    const length = parseFloat(document.getElementById('pd-length').value);
    const density = parseFloat(document.getElementById('pd-density').value);
    const viscosity = parseFloat(document.getElementById('pd-viscosity').value);
    
    const apiKey = await OfficeRuntime.storage.getItem('ENGIVAULT_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch('https://engivault-api.railway.app/api/v1/hydraulics/pressure-drop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        flowRate,
        pipeDiameter: diameter,
        pipeLength: length,
        fluidDensity: density,
        fluidViscosity: viscosity
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const result = data.data || data;
    
    resultDiv.innerHTML = `
      <div class="result-success">
        <h4>Results:</h4>
        <p><strong>Pressure Drop:</strong> ${result.pressureDrop.toFixed(2)} Pa</p>
        <p><strong>Velocity:</strong> ${result.velocity.toFixed(3)} m/s</p>
        <p><strong>Reynolds Number:</strong> ${result.reynoldsNumber.toFixed(0)}</p>
        <p><strong>Friction Factor:</strong> ${result.frictionFactor.toFixed(4)}</p>
      </div>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<div class="result-error">Error: ${error.message}</div>`;
  }
}

/**
 * Calculate pump power
 */
async function calculatePumpPower() {
  const resultDiv = document.getElementById('pump-result');
  resultDiv.innerHTML = '<div class="loading">Calculating...</div>';
  
  try {
    const flowRate = parseFloat(document.getElementById('pp-flow').value);
    const head = parseFloat(document.getElementById('pp-head').value);
    const efficiency = parseFloat(document.getElementById('pp-efficiency').value);
    
    const apiKey = await OfficeRuntime.storage.getItem('ENGIVAULT_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch('https://engivault-api.railway.app/api/v1/pumps/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        flowRate,
        head,
        efficiency,
        fluidDensity: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const result = data.data || data;
    
    resultDiv.innerHTML = `
      <div class="result-success">
        <h4>Results:</h4>
        <p><strong>Hydraulic Power:</strong> ${(result.hydraulicPower / 1000).toFixed(2)} kW</p>
        <p><strong>Shaft Power:</strong> ${(result.shaftPower / 1000).toFixed(2)} kW</p>
        <p><strong>Motor Power:</strong> ${(result.motorPower / 1000).toFixed(2)} kW</p>
      </div>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<div class="result-error">Error: ${error.message}</div>`;
  }
}

/**
 * Calculate LMTD
 */
async function calculateLMTD() {
  const resultDiv = document.getElementById('heat-result');
  resultDiv.innerHTML = '<div class="loading">Calculating...</div>';
  
  try {
    const hotIn = parseFloat(document.getElementById('ht-hotin').value);
    const hotOut = parseFloat(document.getElementById('ht-hotout').value);
    const coldIn = parseFloat(document.getElementById('ht-coldin').value);
    const coldOut = parseFloat(document.getElementById('ht-coldout').value);
    
    const apiKey = await OfficeRuntime.storage.getItem('ENGIVAULT_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const response = await fetch('https://engivault-api.railway.app/api/v1/heat-transfer/lmtd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        tHotIn: hotIn,
        tHotOut: hotOut,
        tColdIn: coldIn,
        tColdOut: coldOut,
        flowArrangement: 'counterflow'
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const result = data.data || data;
    
    resultDiv.innerHTML = `
      <div class="result-success">
        <h4>Results:</h4>
        <p><strong>LMTD:</strong> ${result.lmtd.toFixed(2)} K</p>
        <p><strong>ΔT1:</strong> ${result.deltaT1.toFixed(2)} K</p>
        <p><strong>ΔT2:</strong> ${result.deltaT2.toFixed(2)} K</p>
      </div>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<div class="result-error">Error: ${error.message}</div>`;
  }
}

/**
 * Show status message
 */
function showStatus(element, message, type) {
  element.innerHTML = `<div class="status-${type}">${message}</div>`;
  setTimeout(() => {
    if (type !== 'success') return;
    element.innerHTML = '<span class="status-success">✓ API key configured</span>';
  }, 3000);
}

