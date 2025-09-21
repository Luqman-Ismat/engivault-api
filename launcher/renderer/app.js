// ENGiVAULT Launcher - Main Application Logic
const { ipcRenderer } = require('electron');

class EngiVaultLauncherApp {
  constructor() {
    this.currentScreen = 'welcome';
    this.systemInfo = null;
    this.requirements = null;
    this.installOptions = {
      python: true,
      npm: true,
      excel: false,
      pythonGlobal: true,
      pythonCLI: true,
      npmGlobal: true,
      npmTypes: true,
      excelTemplates: true,
      excelExamples: true
    };
    this.installPath = '';
    this.installationProgress = {};
    this.theme = new ENGiVaultTheme();
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    this.setupEventListeners();
    this.setupIPCListeners();
    await this.loadInitialData();
  }

  /**
   * Setup DOM event listeners
   */
  setupEventListeners() {
    // Welcome screen
    document.getElementById('start-install')?.addEventListener('click', () => {
      this.navigateToScreen('system-check');
    });

    document.getElementById('custom-install')?.addEventListener('click', () => {
      this.navigateToScreen('options');
    });

    // System check screen
    document.getElementById('back-to-welcome')?.addEventListener('click', () => {
      this.navigateToScreen('welcome');
    });

    document.getElementById('continue-to-options')?.addEventListener('click', () => {
      this.navigateToScreen('options');
    });

    // Options screen
    document.getElementById('back-to-system')?.addEventListener('click', () => {
      this.navigateToScreen('system-check');
    });

    document.getElementById('browse-path')?.addEventListener('click', () => {
      this.browseInstallPath();
    });

    document.getElementById('start-installation')?.addEventListener('click', () => {
      this.startInstallation();
    });

    // Progress screen
    document.getElementById('cancel-installation')?.addEventListener('click', () => {
      this.cancelInstallation();
    });

    // Success screen
    document.getElementById('finish-installation')?.addEventListener('click', () => {
      this.finishInstallation();
    });

    // Error screen
    document.getElementById('retry-installation')?.addEventListener('click', () => {
      this.retryInstallation();
    });

    document.getElementById('report-error')?.addEventListener('click', () => {
      this.reportError();
    });

    document.getElementById('close-installer')?.addEventListener('click', () => {
      this.closeInstaller();
    });

    // Footer links
    document.querySelectorAll('[data-action]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAction(link.dataset.action);
      });
    });

    // Installation option checkboxes
    this.setupOptionCheckboxes();
  }

  /**
   * Setup installation option checkboxes
   */
  setupOptionCheckboxes() {
    const optionMappings = {
      'install-python': 'python',
      'install-npm': 'npm',
      'install-excel': 'excel',
      'python-global': 'pythonGlobal',
      'python-cli': 'pythonCLI',
      'npm-global': 'npmGlobal',
      'npm-types': 'npmTypes',
      'excel-templates': 'excelTemplates',
      'excel-examples': 'excelExamples'
    };

    Object.entries(optionMappings).forEach(([elementId, optionKey]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.checked = this.installOptions[optionKey];
        element.addEventListener('change', (e) => {
          this.installOptions[optionKey] = e.target.checked;
          this.updateInstallationOptions();
        });
      }
    });
  }

  /**
   * Update installation options UI
   */
  updateInstallationOptions() {
    // Enable/disable sub-options based on main options
    const pythonEnabled = this.installOptions.python;
    const npmEnabled = this.installOptions.npm;
    const excelEnabled = this.installOptions.excel;

    document.getElementById('python-global').disabled = !pythonEnabled;
    document.getElementById('python-cli').disabled = !pythonEnabled;
    document.getElementById('npm-global').disabled = !npmEnabled;
    document.getElementById('npm-types').disabled = !npmEnabled;
    document.getElementById('excel-templates').disabled = !excelEnabled;
    document.getElementById('excel-examples').disabled = !excelEnabled;

    // Update option cards styling
    document.querySelector('#install-python').closest('.option-card').classList.toggle('disabled', !pythonEnabled);
    document.querySelector('#install-npm').closest('.option-card').classList.toggle('disabled', !npmEnabled);
    document.querySelector('#install-excel').closest('.option-card').classList.toggle('disabled', !excelEnabled);
  }

  /**
   * Setup IPC listeners
   */
  setupIPCListeners() {
    // System information
    ipcRenderer.on('system-info', (event, data) => {
      this.systemInfo = data;
      this.displaySystemInfo(data);
    });

    // Requirements check
    ipcRenderer.on('requirements-check', (event, data) => {
      this.requirements = data;
      this.displayRequirements(data);
    });

    // Installation progress
    ipcRenderer.on('install-progress', (event, data) => {
      this.updateInstallationProgress(data);
    });

    // Errors
    ipcRenderer.on('error', (event, data) => {
      this.showError(data.message, data.error);
    });
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      this.installPath = await ipcRenderer.invoke('get-install-path');
      const pathInput = document.getElementById('install-path');
      if (pathInput) {
        pathInput.value = this.installPath;
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Use default path as fallback
      this.installPath = require('os').homedir() + '/.engivault';
      const pathInput = document.getElementById('install-path');
      if (pathInput) {
        pathInput.value = this.installPath;
      }
    }
  }

  /**
   * Navigate to a screen
   */
  navigateToScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenName;

      // Trigger screen-specific actions
      this.onScreenEnter(screenName);
    }
  }

  /**
   * Handle screen enter events
   */
  async onScreenEnter(screenName) {
    switch (screenName) {
      case 'system-check':
        await this.performSystemCheck();
        break;
      case 'options':
        this.updateInstallationOptions();
        break;
      case 'progress':
        // Progress screen is handled by installation process
        break;
    }
  }

  /**
   * Perform system check
   */
  async performSystemCheck() {
    try {
      // Show loading state
      this.showSystemCheckLoading();

      // Get system info and requirements
      const [systemInfo, requirements] = await Promise.all([
        ipcRenderer.invoke('get-system-info'),
        ipcRenderer.invoke('check-requirements')
      ]);

      this.systemInfo = systemInfo;
      this.requirements = requirements;

      this.displaySystemInfo(this.systemInfo);
      this.displayRequirements(this.requirements);

      // Enable continue button if requirements are met
      const continueBtn = document.getElementById('continue-to-options');
      if (continueBtn) {
        continueBtn.disabled = !this.requirements.canProceed;
      }

    } catch (error) {
      this.showError('System check failed', error.message);
    }
  }

  /**
   * Show system check loading state
   */
  showSystemCheckLoading() {
    const systemDetails = document.getElementById('system-details');
    const requirementsList = document.getElementById('requirements-list');

    if (systemDetails) {
      systemDetails.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Detecting system...</div>';
    }

    if (requirementsList) {
      requirementsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Checking requirements...</div>';
    }
  }

  /**
   * Display system information
   */
  displaySystemInfo(systemInfo) {
    const container = document.getElementById('system-details');
    if (!container) return;

    const html = `
      <div class="system-item">
        <strong>Platform:</strong> ${systemInfo.platform} ${systemInfo.arch}
      </div>
      <div class="system-item">
        <strong>OS:</strong> ${systemInfo.type} ${systemInfo.release}
      </div>
      <div class="system-item">
        <strong>Node.js:</strong> ${systemInfo.nodejs?.version || 'Not detected'}
      </div>
      <div class="system-item">
        <strong>Memory:</strong> ${Math.round(systemInfo.memory.total / 1024 / 1024 / 1024)} GB total, ${Math.round(systemInfo.memory.free / 1024 / 1024 / 1024)} GB free
      </div>
      <div class="system-item">
        <strong>CPU:</strong> ${systemInfo.cpus?.[0]?.model || 'Unknown'} (${systemInfo.cpus?.length || 0} cores)
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Display requirements check results
   */
  displayRequirements(requirements) {
    const container = document.getElementById('requirements-list');
    if (!container) return;

    const html = requirements.checks.map(check => `
      <div class="requirement-item">
        <div class="requirement-status ${check.status}">
          ${this.getStatusIcon(check.status)}
        </div>
        <div class="requirement-text">
          <div class="requirement-name">${check.name}</div>
          <div class="requirement-details">${check.message}</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Get status icon for requirements
   */
  getStatusIcon(status) {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return '?';
    }
  }

  /**
   * Browse for installation path
   */
  async browseInstallPath() {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog', {
        properties: ['openDirectory'],
        title: 'Select Installation Directory'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        this.installPath = result.filePaths[0];
        await ipcRenderer.invoke('set-install-path', this.installPath);
        
        const pathInput = document.getElementById('install-path');
        if (pathInput) {
          pathInput.value = this.installPath;
        }
      }
    } catch (error) {
      this.showError('Failed to browse for directory', error.message);
    }
  }

  /**
   * Start installation process
   */
  async startInstallation() {
    try {
      this.navigateToScreen('progress');
      this.resetInstallationProgress();

      const promises = [];

      // Install Python SDK
      if (this.installOptions.python) {
        promises.push(this.installPython());
      }

      // Install NPM package
      if (this.installOptions.npm) {
        promises.push(this.installNPM());
      }

      // Install Excel integration
      if (this.installOptions.excel) {
        promises.push(this.installExcel());
      }

      // Wait for all installations to complete
      const results = await Promise.allSettled(promises);

      // Check if any installations failed
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        this.showInstallationError(failures);
      } else {
        this.showInstallationSuccess(results.map(r => r.value));
      }

    } catch (error) {
      this.showInstallationError([{ reason: error }]);
    }
  }

  /**
   * Install Python SDK
   */
  async installPython() {
    const options = {
      global: this.installOptions.pythonGlobal,
      includeCLI: this.installOptions.pythonCLI,
      installPath: this.installOptions.pythonGlobal ? null : this.installPath
    };

    return await ipcRenderer.invoke('install-python', options);
  }

  /**
   * Install NPM package
   */
  async installNPM() {
    const options = {
      global: this.installOptions.npmGlobal,
      includeTypes: this.installOptions.npmTypes,
      installPath: this.installOptions.npmGlobal ? null : this.installPath
    };

    return await ipcRenderer.invoke('install-npm', options);
  }

  /**
   * Install Excel integration
   */
  async installExcel() {
    const options = {
      includeTemplates: this.installOptions.excelTemplates,
      includeExamples: this.installOptions.excelExamples,
      installPath: this.installPath
    };

    return await ipcRenderer.invoke('install-excel', options);
  }

  /**
   * Reset installation progress
   */
  resetInstallationProgress() {
    this.installationProgress = {};
    
    // Reset progress bars
    document.getElementById('overall-progress').style.width = '0%';
    document.getElementById('overall-text').textContent = 'Preparing installation...';

    ['python', 'npm', 'excel'].forEach(component => {
      const progressBar = document.getElementById(`${component}-progress-bar`);
      const status = document.getElementById(`${component}-status`);
      
      if (progressBar) progressBar.style.width = '0%';
      if (status) status.textContent = 'Waiting...';
    });

    // Clear log
    const logContainer = document.getElementById('installation-log');
    if (logContainer) {
      logContainer.innerHTML = '';
    }
  }

  /**
   * Update installation progress
   */
  updateInstallationProgress(data) {
    const { component, stage, progress, message } = data;
    
    this.installationProgress[component] = { stage, progress, message };

    // Update component progress
    const progressBar = document.getElementById(`${component}-progress-bar`);
    const status = document.getElementById(`${component}-status`);
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    if (status) {
      status.textContent = message;
    }

    // Update overall progress
    this.updateOverallProgress();

    // Add to log
    this.addToInstallationLog(component, stage, message);
  }

  /**
   * Update overall installation progress
   */
  updateOverallProgress() {
    const components = Object.keys(this.installationProgress);
    if (components.length === 0) return;

    const totalProgress = components.reduce((sum, component) => {
      return sum + (this.installationProgress[component].progress || 0);
    }, 0);

    const averageProgress = Math.round(totalProgress / components.length);
    
    const overallProgressBar = document.getElementById('overall-progress');
    const overallText = document.getElementById('overall-text');
    
    if (overallProgressBar) {
      overallProgressBar.style.width = `${averageProgress}%`;
    }
    
    if (overallText) {
      const activeComponent = components.find(c => 
        this.installationProgress[c].progress > 0 && 
        this.installationProgress[c].progress < 100
      );
      
      if (activeComponent) {
        overallText.textContent = this.installationProgress[activeComponent].message;
      } else if (averageProgress === 100) {
        overallText.textContent = 'Installation completed!';
      }
    }
  }

  /**
   * Add entry to installation log
   */
  addToInstallationLog(component, stage, message) {
    const logContainer = document.getElementById('installation-log');
    if (!logContainer) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry info';
    logEntry.textContent = `[${timestamp}] [${component.toUpperCase()}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  /**
   * Show installation success
   */
  showInstallationSuccess(results) {
    this.navigateToScreen('success');
    
    const summaryContainer = document.getElementById('installed-components');
    if (summaryContainer) {
      const html = results.map(result => {
        if (result.success) {
          const componentName = this.getComponentName(result);
          return `<div class="installed-component">✓ ${componentName} installed successfully</div>`;
        }
        return '';
      }).join('');
      
      summaryContainer.innerHTML = html;
    }
  }

  /**
   * Show installation error
   */
  showInstallationError(failures) {
    this.navigateToScreen('error');
    
    const errorMessage = document.getElementById('error-message');
    const errorLog = document.getElementById('error-log');
    
    if (errorMessage) {
      errorMessage.textContent = `${failures.length} component(s) failed to install`;
    }
    
    if (errorLog) {
      const errorText = failures.map(failure => 
        failure.reason?.message || failure.reason || 'Unknown error'
      ).join('\n\n');
      
      errorLog.textContent = errorText;
    }
  }

  /**
   * Get component name from result
   */
  getComponentName(result) {
    if (result.pythonCommand) return 'Python SDK';
    if (result.npmCommand) return 'NPM Package';
    if (result.excelPath) return 'Excel Integration';
    return 'Unknown Component';
  }

  /**
   * Cancel installation
   */
  cancelInstallation() {
    // This would need to be implemented with proper cancellation logic
    this.navigateToScreen('welcome');
  }

  /**
   * Retry installation
   */
  retryInstallation() {
    this.navigateToScreen('options');
  }

  /**
   * Report error
   */
  async reportError() {
    await this.handleAction('open-github');
  }

  /**
   * Close installer
   */
  async closeInstaller() {
    await ipcRenderer.invoke('quit-app');
  }

  /**
   * Finish installation
   */
  async finishInstallation() {
    await ipcRenderer.invoke('quit-app');
  }

  /**
   * Handle footer actions
   */
  async handleAction(action) {
    const urls = {
      'open-website': 'https://engivault.com',
      'open-docs': 'https://docs.engivault.com',
      'open-support': 'https://github.com/Luqman-Ismat/engivault-api/discussions',
      'open-github': 'https://github.com/Luqman-Ismat/engivault-api',
      'open-examples': 'https://github.com/Luqman-Ismat/engivault-api/tree/main/examples'
    };

    const url = urls[action];
    if (url) {
      await ipcRenderer.invoke('open-external', url);
    }
  }

  /**
   * Show error message
   */
  showError(title, message) {
    // For now, just log to console
    // In a full implementation, this would show a proper error dialog
    console.error(`${title}: ${message}`);
    
    // Could also show a toast notification or modal
    alert(`${title}\n\n${message}`);
  }
}

// ENGiVAULT Theme Management - Automatic System Theme
class ENGiVaultTheme {
  constructor() {
    this.init();
  }

  init() {
    // Always follow system theme
    this.updateToSystemTheme();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.updateToSystemTheme();
    });
  }

  updateToSystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }

  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.engiVaultApp = new EngiVaultLauncherApp();
});

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
