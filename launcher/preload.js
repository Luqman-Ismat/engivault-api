const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  checkRequirements: () => ipcRenderer.invoke('check-requirements'),
  
  // Installation methods
  installPython: (options) => ipcRenderer.invoke('install-python', options),
  installNPM: (options) => ipcRenderer.invoke('install-npm', options),
  installExcel: (options) => ipcRenderer.invoke('install-excel', options),
  
  // Utility methods
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  getInstallPath: () => ipcRenderer.invoke('get-install-path'),
  setInstallPath: (path) => ipcRenderer.invoke('set-install-path', path),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // Event listeners
  onSystemInfo: (callback) => ipcRenderer.on('system-info', callback),
  onRequirementsCheck: (callback) => ipcRenderer.on('requirements-check', callback),
  onInstallProgress: (callback) => ipcRenderer.on('install-progress', callback),
  onError: (callback) => ipcRenderer.on('error', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

