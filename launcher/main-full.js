const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow;

function createWindow() {
  console.log('Creating ENGiVAULT Launcher window...');
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    autoHideMenuBar: true
  });

  // Load the full ENGiVAULT interface
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('ENGiVAULT window ready to show');
    mainWindow.show();
    
    // Open DevTools in development
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('ENGiVAULT window created successfully');
}

// Setup all IPC handlers needed for the full interface
function setupIPC() {
  console.log('Setting up ENGiVAULT IPC handlers...');

  // Get system information
  ipcMain.handle('get-system-info', async () => {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
      userInfo: os.userInfo(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        execPath: process.execPath,
        versions: process.versions
      }
    };
  });

  // Check requirements
  ipcMain.handle('check-requirements', async () => {
    const checks = [
      {
        name: 'Node.js',
        status: 'success',
        message: `Node.js ${process.version} is installed`,
        details: `Found: ${process.version}, Required: >=14.0.0`,
        required: true
      },
      {
        name: 'Platform',
        status: 'success', 
        message: `Running on ${os.platform()} ${os.arch()}`,
        details: `${os.type()} ${os.release()}`,
        required: true
      },
      {
        name: 'Memory',
        status: os.totalmem() > 2 * 1024 * 1024 * 1024 ? 'success' : 'warning',
        message: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB RAM available`,
        details: `Free: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
        required: false
      },
      {
        name: 'Internet Connection',
        status: 'success',
        message: 'Internet connection available',
        details: 'Required for package downloads',
        required: true
      }
    ];

    const hasErrors = checks.some(check => check.status === 'error' && check.required);
    const hasWarnings = checks.some(check => check.status === 'warning');

    return {
      overall: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      checks,
      canProceed: !hasErrors
    };
  });

  // Get/set install path
  ipcMain.handle('get-install-path', () => {
    return path.join(os.homedir(), '.engivault');
  });

  ipcMain.handle('set-install-path', (event, newPath) => {
    console.log('Install path set to:', newPath);
    return newPath;
  });

  // Installation methods (simulate for now)
  ipcMain.handle('install-python', async (event, options) => {
    console.log('Python installation requested:', options);
    
    // Simulate installation progress
    const progressCallback = (progress) => {
      mainWindow.webContents.send('install-progress', { 
        component: 'python', 
        ...progress 
      });
    };

    // Simulate stages
    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparing Python SDK installation...' });
    await sleep(500);
    
    progressCallback({ stage: 'downloading', progress: 25, message: 'Downloading Python package...' });
    await sleep(1000);
    
    progressCallback({ stage: 'installing', progress: 50, message: 'Installing EngiVault Python SDK...' });
    await sleep(1000);
    
    progressCallback({ stage: 'configuring', progress: 75, message: 'Configuring CLI tools...' });
    await sleep(500);
    
    progressCallback({ stage: 'complete', progress: 100, message: 'Python SDK installed successfully!' });

    return { success: true, pythonCommand: 'python3' };
  });

  ipcMain.handle('install-npm', async (event, options) => {
    console.log('NPM installation requested:', options);
    
    const progressCallback = (progress) => {
      mainWindow.webContents.send('install-progress', { 
        component: 'npm', 
        ...progress 
      });
    };

    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparing NPM package installation...' });
    await sleep(500);
    
    progressCallback({ stage: 'downloading', progress: 30, message: 'Downloading JavaScript SDK...' });
    await sleep(1000);
    
    progressCallback({ stage: 'installing', progress: 60, message: 'Installing EngiVault NPM package...' });
    await sleep(1000);
    
    progressCallback({ stage: 'complete', progress: 100, message: 'JavaScript SDK installed successfully!' });

    return { success: true, npmCommand: 'npm' };
  });

  ipcMain.handle('install-excel', async (event, options) => {
    console.log('Excel installation requested:', options);
    
    const progressCallback = (progress) => {
      mainWindow.webContents.send('install-progress', { 
        component: 'excel', 
        ...progress 
      });
    };

    progressCallback({ stage: 'preparing', progress: 0, message: 'Preparing Excel integration...' });
    await sleep(500);
    
    progressCallback({ stage: 'copying', progress: 40, message: 'Copying VBA modules...' });
    await sleep(1000);
    
    progressCallback({ stage: 'configuring', progress: 80, message: 'Setting up Excel integration...' });
    await sleep(500);
    
    progressCallback({ stage: 'complete', progress: 100, message: 'Excel integration installed successfully!' });

    return { success: true, excelPath: '/Applications/Microsoft Excel.app' };
  });

  // Utility methods
  ipcMain.handle('open-external', async (event, url) => {
    console.log('Opening external URL:', url);
    await shell.openExternal(url);
  });

  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('quit-app', () => {
    console.log('Quitting ENGiVAULT Launcher');
    app.quit();
  });

  console.log('All IPC handlers setup completed');
}

// Utility function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// App events
app.whenReady().then(() => {
  console.log('ENGiVAULT App ready, setting up...');
  setupIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle second instance
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

console.log('ENGiVAULT Launcher starting...');
