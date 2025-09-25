const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow;

function createWindow() {
  console.log('Creating test window...');
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: true, // Show immediately
    resizable: true,
    center: true
  });

  // Load test HTML
  mainWindow.loadFile(path.join(__dirname, 'test.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('Test window created');
}

// Simple IPC for testing
ipcMain.handle('get-system-info', () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodejs: {
      version: process.version
    }
  };
});

// App events
app.whenReady().then(() => {
  console.log('App ready, creating window...');
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

console.log('ENGiVAULT Test Launcher starting...');

