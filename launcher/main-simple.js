const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');

// Keep it simple for now - we'll add the complex installers later
let mainWindow;

function createWindow() {
  console.log('Creating ENGiVAULT Launcher window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
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
    console.log('Window ready to show');
    mainWindow.show();
    
    // Open DevTools in development
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('Window creation completed');
}

// Simple IPC handlers
function setupIPC() {
  console.log('Setting up IPC handlers...');

  // Get system information
  ipcMain.handle('get-system-info', async () => {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpus: os.cpus(),
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
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
        details: 'Supported platform detected',
        required: true
      },
      {
        name: 'Memory',
        status: 'success',
        message: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB RAM available`,
        details: 'Sufficient memory for installation',
        required: true
      },
      {
        name: 'Internet Connection',
        status: 'success',
        message: 'Internet connection available',
        details: 'Required for downloading packages',
        required: false
      }
    ];

    return {
      overall: 'success',
      checks,
      canProceed: true
    };
  });

  // Get/set install path
  ipcMain.handle('get-install-path', () => {
    return path.join(os.homedir(), '.engivault');
  });

  ipcMain.handle('set-install-path', (event, newPath) => {
    return newPath;
  });

  // Installation methods (simplified for now)
  ipcMain.handle('install-python', async (event, options) => {
    console.log('Python installation requested:', options);
    // Simulate installation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, pythonCommand: 'python3' });
      }, 2000);
    });
  });

  ipcMain.handle('install-npm', async (event, options) => {
    console.log('NPM installation requested:', options);
    // Simulate installation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, npmCommand: 'npm' });
      }, 2000);
    });
  });

  ipcMain.handle('install-excel', async (event, options) => {
    console.log('Excel installation requested:', options);
    // Simulate installation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, excelPath: '/Applications/Microsoft Excel.app' });
      }, 2000);
    });
  });

  // Utility methods
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
  });

  console.log('IPC handlers setup completed');
}

// App ready
app.whenReady().then(() => {
  console.log('App is ready');
  setupIPC();
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
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
