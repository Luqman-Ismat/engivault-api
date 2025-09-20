const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { download } = require('../utils/download');
const Logger = require('../utils/logger');

class PythonInstaller {
  constructor() {
    this.logger = new Logger();
    this.platform = os.platform();
    this.arch = os.arch();
    this.pythonCommand = this.detectPythonCommand();
    this.pipCommand = this.detectPipCommand();
  }

  /**
   * Detect the correct Python command for this system
   */
  detectPythonCommand() {
    const commands = ['python3', 'python', 'py'];
    
    for (const cmd of commands) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8', timeout: 5000 });
        if (version.includes('Python')) {
          this.logger.info(`Found Python command: ${cmd}`);
          return cmd;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.logger.warn('No Python command found');
    return 'python3'; // Default fallback
  }

  /**
   * Detect the correct pip command for this system
   */
  detectPipCommand() {
    const commands = ['pip3', 'pip', 'py -m pip'];
    
    for (const cmd of commands) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8', timeout: 5000 });
        if (version.includes('pip')) {
          this.logger.info(`Found pip command: ${cmd}`);
          return cmd;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.logger.warn('No pip command found');
    return 'pip3'; // Default fallback
  }

  /**
   * Install the EngiVault Python SDK
   */
  async install(options = {}, progressCallback) {
    const {
      global = true,
      includeCLI = true,
      includeExtras = ['dev', 'docs'],
      installPath = null,
      version = 'latest'
    } = options;

    try {
      progressCallback?.({ 
        stage: 'preparing', 
        progress: 0, 
        message: 'Preparing Python SDK installation...' 
      });

      // Step 1: Verify Python and pip
      await this.verifyPythonEnvironment(progressCallback);

      // Step 2: Upgrade pip if needed
      await this.upgradePip(progressCallback);

      // Step 3: Create virtual environment if not global
      let venvPath = null;
      if (!global) {
        venvPath = await this.createVirtualEnvironment(installPath, progressCallback);
      }

      // Step 4: Install the package
      await this.installPackage(version, includeExtras, venvPath, progressCallback);

      // Step 5: Verify installation
      await this.verifyInstallation(venvPath, progressCallback);

      // Step 6: Setup CLI if requested
      if (includeCLI) {
        await this.setupCLI(venvPath, progressCallback);
      }

      // Step 7: Create shortcuts/aliases
      await this.createShortcuts(venvPath, progressCallback);

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Python SDK installation completed successfully!' 
      });

      return {
        success: true,
        pythonCommand: this.pythonCommand,
        pipCommand: this.pipCommand,
        venvPath,
        installedVersion: await this.getInstalledVersion(venvPath),
        cliAvailable: includeCLI
      };

    } catch (error) {
      this.logger.error('Python installation failed:', error);
      progressCallback?.({ 
        stage: 'error', 
        progress: 0, 
        message: `Installation failed: ${error.message}` 
      });
      throw error;
    }
  }

  /**
   * Verify Python environment
   */
  async verifyPythonEnvironment(progressCallback) {
    progressCallback?.({ 
      stage: 'verifying', 
      progress: 10, 
      message: 'Verifying Python environment...' 
    });

    try {
      // Check Python version
      const pythonVersion = execSync(`${this.pythonCommand} --version`, { 
        encoding: 'utf8',
        timeout: 10000 
      }).trim();
      
      this.logger.info(`Python version: ${pythonVersion}`);

      // Check pip version
      const pipVersion = execSync(`${this.pipCommand} --version`, { 
        encoding: 'utf8',
        timeout: 10000 
      }).trim();
      
      this.logger.info(`Pip version: ${pipVersion}`);

      // Verify minimum versions
      const pythonVersionNumber = pythonVersion.match(/Python (\d+\.\d+\.\d+)/)?.[1];
      if (!pythonVersionNumber || !this.isVersionSupported(pythonVersionNumber, '3.8.0')) {
        throw new Error(`Python 3.8+ is required. Found: ${pythonVersionNumber}`);
      }

    } catch (error) {
      throw new Error(`Python environment verification failed: ${error.message}`);
    }
  }

  /**
   * Upgrade pip to latest version
   */
  async upgradePip(progressCallback) {
    progressCallback?.({ 
      stage: 'upgrading-pip', 
      progress: 20, 
      message: 'Upgrading pip...' 
    });

    try {
      const upgradeCommand = `${this.pipCommand} install --upgrade pip`;
      
      await this.executeCommand(upgradeCommand, {
        onData: (data) => {
          this.logger.info(`pip upgrade: ${data}`);
        }
      });

      this.logger.info('pip upgraded successfully');
    } catch (error) {
      this.logger.warn(`Failed to upgrade pip: ${error.message}`);
      // Don't fail the installation if pip upgrade fails
    }
  }

  /**
   * Create virtual environment
   */
  async createVirtualEnvironment(installPath, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-venv', 
      progress: 30, 
      message: 'Creating virtual environment...' 
    });

    const venvPath = installPath || path.join(os.homedir(), '.engivault', 'python-env');
    
    try {
      await fs.ensureDir(path.dirname(venvPath));
      
      const createCommand = `${this.pythonCommand} -m venv "${venvPath}"`;
      await this.executeCommand(createCommand);

      this.logger.info(`Virtual environment created at: ${venvPath}`);
      return venvPath;
    } catch (error) {
      throw new Error(`Failed to create virtual environment: ${error.message}`);
    }
  }

  /**
   * Install the EngiVault package
   */
  async installPackage(version, extras, venvPath, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-package', 
      progress: 50, 
      message: 'Installing EngiVault Python SDK...' 
    });

    try {
      // Determine pip command (with venv if applicable)
      let pipCmd = this.pipCommand;
      if (venvPath) {
        const pipPath = this.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'pip.exe')
          : path.join(venvPath, 'bin', 'pip');
        pipCmd = `"${pipPath}"`;
      }

      // Build package specifier
      let packageSpec = 'engivault';
      if (version && version !== 'latest') {
        packageSpec += `==${version}`;
      }

      // Add extras
      if (extras && extras.length > 0) {
        packageSpec += `[${extras.join(',')}]`;
      }

      // Install command
      const installCommand = `${pipCmd} install ${packageSpec}`;
      
      await this.executeCommand(installCommand, {
        onData: (data) => {
          this.logger.info(`pip install: ${data}`);
          
          // Parse progress from pip output
          if (data.includes('Downloading')) {
            progressCallback?.({ 
              stage: 'downloading', 
              progress: 60, 
              message: 'Downloading package...' 
            });
          } else if (data.includes('Installing')) {
            progressCallback?.({ 
              stage: 'installing', 
              progress: 70, 
              message: 'Installing dependencies...' 
            });
          }
        }
      });

      this.logger.info('EngiVault package installed successfully');
    } catch (error) {
      throw new Error(`Package installation failed: ${error.message}`);
    }
  }

  /**
   * Verify installation
   */
  async verifyInstallation(venvPath, progressCallback) {
    progressCallback?.({ 
      stage: 'verifying-install', 
      progress: 80, 
      message: 'Verifying installation...' 
    });

    try {
      // Determine python command (with venv if applicable)
      let pythonCmd = this.pythonCommand;
      if (venvPath) {
        const pythonPath = this.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        pythonCmd = `"${pythonPath}"`;
      }

      // Test import
      const testCommand = `${pythonCmd} -c "import engivault; print(f'EngiVault {engivault.__version__} installed successfully')"`;
      const result = await this.executeCommand(testCommand);
      
      this.logger.info(`Installation verified: ${result}`);
    } catch (error) {
      throw new Error(`Installation verification failed: ${error.message}`);
    }
  }

  /**
   * Setup CLI tools
   */
  async setupCLI(venvPath, progressCallback) {
    progressCallback?.({ 
      stage: 'setup-cli', 
      progress: 85, 
      message: 'Setting up CLI tools...' 
    });

    try {
      // Test CLI availability
      let cliCmd = 'engivault';
      if (venvPath) {
        const cliPath = this.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'engivault.exe')
          : path.join(venvPath, 'bin', 'engivault');
        cliCmd = `"${cliPath}"`;
      }

      // Test CLI command
      const testCommand = `${cliCmd} --version`;
      const result = await this.executeCommand(testCommand);
      
      this.logger.info(`CLI setup verified: ${result}`);
    } catch (error) {
      this.logger.warn(`CLI setup failed: ${error.message}`);
      // Don't fail installation if CLI setup fails
    }
  }

  /**
   * Create shortcuts and aliases
   */
  async createShortcuts(venvPath, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-shortcuts', 
      progress: 90, 
      message: 'Creating shortcuts...' 
    });

    try {
      if (this.platform === 'win32') {
        await this.createWindowsShortcuts(venvPath);
      } else if (this.platform === 'darwin') {
        await this.createMacShortcuts(venvPath);
      } else {
        await this.createLinuxShortcuts(venvPath);
      }
    } catch (error) {
      this.logger.warn(`Shortcut creation failed: ${error.message}`);
      // Don't fail installation if shortcut creation fails
    }
  }

  /**
   * Create Windows shortcuts
   */
  async createWindowsShortcuts(venvPath) {
    if (!venvPath) return;

    try {
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault');
      await fs.ensureDir(shortcutsDir);

      // Create batch file for CLI access
      const batchContent = `@echo off
"${path.join(venvPath, 'Scripts', 'engivault.exe')}" %*`;
      
      await fs.writeFile(path.join(shortcutsDir, 'engivault.bat'), batchContent);
      
      this.logger.info('Windows shortcuts created');
    } catch (error) {
      this.logger.warn(`Windows shortcut creation failed: ${error.message}`);
    }
  }

  /**
   * Create macOS shortcuts
   */
  async createMacShortcuts(venvPath) {
    if (!venvPath) return;

    try {
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault');
      await fs.ensureDir(shortcutsDir);

      // Create shell script for CLI access
      const scriptContent = `#!/bin/bash
"${path.join(venvPath, 'bin', 'engivault')}" "$@"`;
      
      const scriptPath = path.join(shortcutsDir, 'engivault.sh');
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, '755');
      
      this.logger.info('macOS shortcuts created');
    } catch (error) {
      this.logger.warn(`macOS shortcut creation failed: ${error.message}`);
    }
  }

  /**
   * Create Linux shortcuts
   */
  async createLinuxShortcuts(venvPath) {
    if (!venvPath) return;

    try {
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault');
      await fs.ensureDir(shortcutsDir);

      // Create shell script for CLI access
      const scriptContent = `#!/bin/bash
"${path.join(venvPath, 'bin', 'engivault')}" "$@"`;
      
      const scriptPath = path.join(shortcutsDir, 'engivault.sh');
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, '755');

      // Create desktop entry
      const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=EngiVault CLI
Comment=EngiVault Command Line Interface
Exec=${scriptPath}
Icon=terminal
Terminal=true
Categories=Development;Engineering;`;

      await fs.writeFile(path.join(shortcutsDir, 'engivault.desktop'), desktopEntry);
      
      this.logger.info('Linux shortcuts created');
    } catch (error) {
      this.logger.warn(`Linux shortcut creation failed: ${error.message}`);
    }
  }

  /**
   * Get installed package version
   */
  async getInstalledVersion(venvPath) {
    try {
      let pythonCmd = this.pythonCommand;
      if (venvPath) {
        const pythonPath = this.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        pythonCmd = `"${pythonPath}"`;
      }

      const versionCommand = `${pythonCmd} -c "import engivault; print(engivault.__version__)"`;
      const version = await this.executeCommand(versionCommand);
      
      return version.trim();
    } catch (error) {
      this.logger.warn(`Could not get installed version: ${error.message}`);
      return 'unknown';
    }
  }

  /**
   * Uninstall the EngiVault package
   */
  async uninstall(venvPath = null, progressCallback) {
    try {
      progressCallback?.({ 
        stage: 'uninstalling', 
        progress: 0, 
        message: 'Uninstalling EngiVault Python SDK...' 
      });

      // Determine pip command
      let pipCmd = this.pipCommand;
      if (venvPath) {
        const pipPath = this.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'pip.exe')
          : path.join(venvPath, 'bin', 'pip');
        pipCmd = `"${pipPath}"`;
      }

      // Uninstall command
      const uninstallCommand = `${pipCmd} uninstall engivault -y`;
      await this.executeCommand(uninstallCommand);

      // Remove virtual environment if it exists
      if (venvPath && await fs.pathExists(venvPath)) {
        await fs.remove(venvPath);
        this.logger.info(`Removed virtual environment: ${venvPath}`);
      }

      // Remove shortcuts
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault');
      if (await fs.pathExists(shortcutsDir)) {
        await fs.remove(shortcutsDir);
        this.logger.info('Removed shortcuts');
      }

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'EngiVault Python SDK uninstalled successfully!' 
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Python uninstallation failed:', error);
      throw error;
    }
  }

  /**
   * Execute a command with proper error handling
   */
  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const { onData, timeout = 60000 } = options;
      
      this.logger.info(`Executing: ${command}`);
      
      const child = spawn(command, [], { 
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        onData?.(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        onData?.(text);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput || output}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Command timed out'));
      }, timeout);

      child.on('close', () => {
        clearTimeout(timer);
      });
    });
  }

  /**
   * Check if version meets minimum requirement
   */
  isVersionSupported(version, minVersion) {
    const parseVersion = (v) => v.split('.').map(Number);
    const current = parseVersion(version);
    const minimum = parseVersion(minVersion);
    
    for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
      const curr = current[i] || 0;
      const min = minimum[i] || 0;
      
      if (curr > min) return true;
      if (curr < min) return false;
    }
    
    return true; // Equal versions
  }
}

module.exports = PythonInstaller;
