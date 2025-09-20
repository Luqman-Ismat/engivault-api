const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// Import our installer modules
const PythonInstaller = require('./src/installers/python-installer');
const NPMInstaller = require('./src/installers/npm-installer');
const ExcelInstaller = require('./src/installers/excel-installer');
const SystemChecker = require('./src/installers/system-checker');
const Logger = require('./src/utils/logger');

class EngiVaultLauncher {
  constructor() {
    this.mainWindow = null;
    this.logger = new Logger();
    this.systemChecker = new SystemChecker();
    this.pythonInstaller = new PythonInstaller();
    this.npmInstaller = new NPMInstaller();
    this.excelInstaller = new ExcelInstaller();
    
    this.isDevelopment = process.argv.includes('--dev');
    this.installationPath = path.join(os.homedir(), '.engivault');
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, 'assets/icons/icon.png'),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false
    });

    // Load the main interface
    await this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.isDevelopment) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Initialize system check
    this.performSystemCheck();
  }

  async performSystemCheck() {
    try {
      const systemInfo = await this.systemChecker.getSystemInfo();
      this.sendToRenderer('system-info', systemInfo);
      
      const requirements = await this.systemChecker.checkRequirements();
      this.sendToRenderer('requirements-check', requirements);
    } catch (error) {
      this.logger.error('System check failed:', error);
      this.sendToRenderer('error', { message: 'System check failed', error: error.message });
    }
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  setupIPC() {
    // Get system information
    ipcMain.handle('get-system-info', async () => {
      return await this.systemChecker.getSystemInfo();
    });

    // Check installation requirements
    ipcMain.handle('check-requirements', async () => {
      return await this.systemChecker.checkRequirements();
    });

    // Install Python SDK
    ipcMain.handle('install-python', async (event, options) => {
      try {
        const result = await this.pythonInstaller.install(options, (progress) => {
          this.sendToRenderer('install-progress', { component: 'python', ...progress });
        });
        return { success: true, result };
      } catch (error) {
        this.logger.error('Python installation failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Install NPM package
    ipcMain.handle('install-npm', async (event, options) => {
      try {
        const result = await this.npmInstaller.install(options, (progress) => {
          this.sendToRenderer('install-progress', { component: 'npm', ...progress });
        });
        return { success: true, result };
      } catch (error) {
        this.logger.error('NPM installation failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Install Excel integration
    ipcMain.handle('install-excel', async (event, options) => {
      try {
        const result = await this.excelInstaller.install(options, (progress) => {
          this.sendToRenderer('install-progress', { component: 'excel', ...progress });
        });
        return { success: true, result };
      } catch (error) {
        this.logger.error('Excel installation failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Open external links
    ipcMain.handle('open-external', async (event, url) => {
      await shell.openExternal(url);
    });

    // Show file dialog
    ipcMain.handle('show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    // Show save dialog
    ipcMain.handle('show-save-dialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    // Get installation path
    ipcMain.handle('get-install-path', () => {
      return this.installationPath;
    });

    // Set installation path
    ipcMain.handle('set-install-path', (event, newPath) => {
      this.installationPath = newPath;
      return this.installationPath;
    });

    // Quit application
    ipcMain.handle('quit-app', () => {
      app.quit();
    });
  }

  async initialize() {
    // Ensure single instance
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }

    // Handle second instance
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    // App event handlers
    app.on('ready', async () => {
      await this.createMainWindow();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', async () => {
      if (this.mainWindow === null) {
        await this.createMainWindow();
      }
    });

    // Handle app updates (future feature)
    app.on('ready', () => {
      // TODO: Implement auto-updater
    });
  }
}

// Initialize and start the launcher
const launcher = new EngiVaultLauncher();
launcher.initialize().catch(error => {
  console.error('Failed to initialize EngiVault Launcher:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // TODO: Send error report
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // TODO: Send error report
});
