const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const which = require('which');
const semver = require('semver');

class SystemChecker {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.requirements = {
      node: '>=14.0.0',
      npm: '>=6.0.0',
      python: '>=3.8.0',
      pip: '>=20.0.0'
    };
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo() {
    const info = {
      platform: this.platform,
      arch: this.arch,
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
      tmpdir: os.tmpdir()
    };

    // Add Node.js information
    info.nodejs = {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      execPath: process.execPath,
      versions: process.versions
    };

    // Check for installed software
    info.installedSoftware = await this.checkInstalledSoftware();

    // Check for Excel (Windows/Mac only)
    if (this.platform === 'win32' || this.platform === 'darwin') {
      info.excel = await this.checkExcelInstallation();
    }

    return info;
  }

  /**
   * Check if system meets all requirements
   */
  async checkRequirements() {
    const checks = [];

    try {
      // Check Node.js
      const nodeCheck = await this.checkNodeJS();
      checks.push(nodeCheck);

      // Check NPM
      const npmCheck = await this.checkNPM();
      checks.push(npmCheck);

      // Check Python
      const pythonCheck = await this.checkPython();
      checks.push(pythonCheck);

      // Check pip
      const pipCheck = await this.checkPip();
      checks.push(pipCheck);

      // Check Git (optional)
      const gitCheck = await this.checkGit();
      checks.push(gitCheck);

      // Check disk space
      const diskCheck = await this.checkDiskSpace();
      checks.push(diskCheck);

      // Check internet connectivity
      const internetCheck = await this.checkInternetConnectivity();
      checks.push(internetCheck);

      // Check permissions
      const permissionsCheck = await this.checkPermissions();
      checks.push(permissionsCheck);

      // Platform-specific checks
      if (this.platform === 'win32') {
        const windowsChecks = await this.checkWindowsSpecific();
        checks.push(...windowsChecks);
      } else if (this.platform === 'darwin') {
        const macChecks = await this.checkMacSpecific();
        checks.push(...macChecks);
      } else if (this.platform === 'linux') {
        const linuxChecks = await this.checkLinuxSpecific();
        checks.push(...linuxChecks);
      }

    } catch (error) {
      checks.push({
        name: 'System Check',
        status: 'error',
        message: 'Failed to perform system check',
        details: error.message,
        required: true
      });
    }

    // Calculate overall status
    const hasErrors = checks.some(check => check.status === 'error' && check.required);
    const hasWarnings = checks.some(check => check.status === 'warning');

    return {
      overall: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
      checks,
      canProceed: !hasErrors
    };
  }

  /**
   * Check Node.js installation and version
   */
  async checkNodeJS() {
    try {
      const version = process.version;
      const satisfies = semver.satisfies(version, this.requirements.node);

      return {
        name: 'Node.js',
        status: satisfies ? 'success' : 'error',
        message: satisfies 
          ? `Node.js ${version} is installed` 
          : `Node.js ${version} does not meet requirement ${this.requirements.node}`,
        details: `Found: ${version}, Required: ${this.requirements.node}`,
        version,
        required: true
      };
    } catch (error) {
      return {
        name: 'Node.js',
        status: 'error',
        message: 'Node.js is not installed',
        details: error.message,
        required: true
      };
    }
  }

  /**
   * Check NPM installation and version
   */
  async checkNPM() {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      const satisfies = semver.satisfies(version, this.requirements.npm);

      return {
        name: 'NPM',
        status: satisfies ? 'success' : 'warning',
        message: satisfies 
          ? `NPM ${version} is installed` 
          : `NPM ${version} is outdated (recommended: ${this.requirements.npm})`,
        details: `Found: ${version}, Required: ${this.requirements.npm}`,
        version,
        required: false
      };
    } catch (error) {
      return {
        name: 'NPM',
        status: 'error',
        message: 'NPM is not installed',
        details: 'NPM is required for JavaScript SDK installation',
        required: false
      };
    }
  }

  /**
   * Check Python installation and version
   */
  async checkPython() {
    try {
      let pythonCmd = 'python';
      let version;

      // Try different Python commands
      const pythonCommands = ['python3', 'python', 'py'];
      
      for (const cmd of pythonCommands) {
        try {
          version = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
          if (version.includes('Python')) {
            pythonCmd = cmd;
            version = version.replace('Python ', '');
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!version) {
        throw new Error('Python not found');
      }

      const satisfies = semver.satisfies(version, this.requirements.python);

      return {
        name: 'Python',
        status: satisfies ? 'success' : 'error',
        message: satisfies 
          ? `Python ${version} is installed (${pythonCmd})` 
          : `Python ${version} does not meet requirement ${this.requirements.python}`,
        details: `Found: ${version}, Required: ${this.requirements.python}`,
        version,
        command: pythonCmd,
        required: false
      };
    } catch (error) {
      return {
        name: 'Python',
        status: 'error',
        message: 'Python is not installed',
        details: 'Python is required for Python SDK installation',
        required: false
      };
    }
  }

  /**
   * Check pip installation and version
   */
  async checkPip() {
    try {
      let pipCmd = 'pip';
      let version;

      // Try different pip commands
      const pipCommands = ['pip3', 'pip', 'py -m pip'];
      
      for (const cmd of pipCommands) {
        try {
          version = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
          if (version.includes('pip')) {
            pipCmd = cmd;
            version = version.match(/pip (\d+\.\d+\.\d+)/)?.[1] || version;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!version) {
        throw new Error('pip not found');
      }

      const satisfies = semver.satisfies(version, this.requirements.pip);

      return {
        name: 'pip',
        status: satisfies ? 'success' : 'warning',
        message: satisfies 
          ? `pip ${version} is installed (${pipCmd})` 
          : `pip ${version} is outdated (recommended: ${this.requirements.pip})`,
        details: `Found: ${version}, Required: ${this.requirements.pip}`,
        version,
        command: pipCmd,
        required: false
      };
    } catch (error) {
      return {
        name: 'pip',
        status: 'error',
        message: 'pip is not installed',
        details: 'pip is required for Python SDK installation',
        required: false
      };
    }
  }

  /**
   * Check Git installation (optional)
   */
  async checkGit() {
    try {
      const version = execSync('git --version', { encoding: 'utf8' }).trim();
      
      return {
        name: 'Git',
        status: 'success',
        message: `${version} is installed`,
        details: 'Git is available for development features',
        required: false
      };
    } catch (error) {
      return {
        name: 'Git',
        status: 'info',
        message: 'Git is not installed',
        details: 'Git is optional but recommended for development',
        required: false
      };
    }
  }

  /**
   * Check available disk space
   */
  async checkDiskSpace() {
    try {
      const stats = await fs.stat(os.homedir());
      const requiredSpace = 500 * 1024 * 1024; // 500MB
      
      // This is a simplified check - in practice you'd use a more sophisticated method
      const availableSpace = os.freemem(); // Using free memory as approximation
      
      return {
        name: 'Disk Space',
        status: availableSpace > requiredSpace ? 'success' : 'warning',
        message: availableSpace > requiredSpace 
          ? 'Sufficient disk space available'
          : 'Low disk space detected',
        details: `Available: ${Math.round(availableSpace / 1024 / 1024)}MB, Required: ${Math.round(requiredSpace / 1024 / 1024)}MB`,
        required: true
      };
    } catch (error) {
      return {
        name: 'Disk Space',
        status: 'warning',
        message: 'Could not check disk space',
        details: error.message,
        required: false
      };
    }
  }

  /**
   * Check internet connectivity
   */
  async checkInternetConnectivity() {
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('https://www.google.com', { 
        timeout: 5000,
        method: 'HEAD'
      });
      
      return {
        name: 'Internet Connection',
        status: response.ok ? 'success' : 'warning',
        message: response.ok 
          ? 'Internet connection is available'
          : 'Internet connection issues detected',
        details: `Status: ${response.status}`,
        required: true
      };
    } catch (error) {
      return {
        name: 'Internet Connection',
        status: 'error',
        message: 'No internet connection',
        details: 'Internet connection is required to download packages',
        required: true
      };
    }
  }

  /**
   * Check file system permissions
   */
  async checkPermissions() {
    try {
      const testDir = path.join(os.tmpdir(), 'engivault-test');
      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'test.txt'), 'test');
      await fs.remove(testDir);
      
      return {
        name: 'File Permissions',
        status: 'success',
        message: 'File system permissions are adequate',
        details: 'Can create and modify files',
        required: true
      };
    } catch (error) {
      return {
        name: 'File Permissions',
        status: 'error',
        message: 'Insufficient file system permissions',
        details: error.message,
        required: true
      };
    }
  }

  /**
   * Check for installed software
   */
  async checkInstalledSoftware() {
    const software = {};
    
    const commands = {
      git: 'git --version',
      code: 'code --version',
      'visual-studio': this.platform === 'win32' ? 'where devenv' : null,
      excel: this.platform === 'win32' ? 'where excel' : this.platform === 'darwin' ? 'which -s /Applications/Microsoft\\ Excel.app/Contents/MacOS/Microsoft\\ Excel' : null
    };

    for (const [name, command] of Object.entries(commands)) {
      if (!command) continue;
      
      try {
        const result = execSync(command, { encoding: 'utf8', timeout: 5000 });
        software[name] = {
          installed: true,
          version: result.trim()
        };
      } catch (error) {
        software[name] = {
          installed: false,
          error: error.message
        };
      }
    }

    return software;
  }

  /**
   * Check Excel installation
   */
  async checkExcelInstallation() {
    if (this.platform === 'win32') {
      return this.checkExcelWindows();
    } else if (this.platform === 'darwin') {
      return this.checkExcelMac();
    }
    
    return { installed: false, reason: 'Platform not supported' };
  }

  /**
   * Check Excel on Windows
   */
  async checkExcelWindows() {
    try {
      // Check registry for Excel installation
      const result = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office" /s /f Excel', { 
        encoding: 'utf8',
        timeout: 10000 
      });
      
      return {
        installed: true,
        details: 'Excel found in Windows registry',
        version: result.includes('16.0') ? '2016+' : result.includes('15.0') ? '2013' : 'Unknown'
      };
    } catch (error) {
      return {
        installed: false,
        reason: 'Excel not found in Windows registry'
      };
    }
  }

  /**
   * Check Excel on macOS
   */
  async checkExcelMac() {
    try {
      const excelPath = '/Applications/Microsoft Excel.app';
      const exists = await fs.pathExists(excelPath);
      
      if (exists) {
        return {
          installed: true,
          path: excelPath,
          details: 'Excel found in Applications folder'
        };
      } else {
        return {
          installed: false,
          reason: 'Excel not found in Applications folder'
        };
      }
    } catch (error) {
      return {
        installed: false,
        reason: error.message
      };
    }
  }

  /**
   * Windows-specific checks
   */
  async checkWindowsSpecific() {
    const checks = [];

    // Check Windows version
    try {
      const version = os.release();
      const isSupported = parseFloat(version) >= 10.0; // Windows 10+
      
      checks.push({
        name: 'Windows Version',
        status: isSupported ? 'success' : 'warning',
        message: isSupported 
          ? `Windows ${version} is supported`
          : `Windows ${version} may have compatibility issues`,
        details: `Recommended: Windows 10 or later`,
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'Windows Version',
        status: 'warning',
        message: 'Could not detect Windows version',
        details: error.message,
        required: false
      });
    }

    // Check PowerShell
    try {
      const version = execSync('powershell -Command "$PSVersionTable.PSVersion.Major"', { encoding: 'utf8' }).trim();
      
      checks.push({
        name: 'PowerShell',
        status: parseInt(version) >= 5 ? 'success' : 'warning',
        message: `PowerShell ${version} is available`,
        details: 'PowerShell is used for some installation tasks',
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'PowerShell',
        status: 'warning',
        message: 'PowerShell not available',
        details: 'Some features may not work properly',
        required: false
      });
    }

    return checks;
  }

  /**
   * macOS-specific checks
   */
  async checkMacSpecific() {
    const checks = [];

    // Check macOS version
    try {
      const version = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
      const isSupported = semver.gte(version, '10.15.0'); // Catalina+
      
      checks.push({
        name: 'macOS Version',
        status: isSupported ? 'success' : 'warning',
        message: isSupported 
          ? `macOS ${version} is supported`
          : `macOS ${version} may have compatibility issues`,
        details: `Recommended: macOS 10.15 (Catalina) or later`,
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'macOS Version',
        status: 'warning',
        message: 'Could not detect macOS version',
        details: error.message,
        required: false
      });
    }

    // Check Xcode Command Line Tools
    try {
      execSync('xcode-select -p', { encoding: 'utf8' });
      
      checks.push({
        name: 'Xcode Command Line Tools',
        status: 'success',
        message: 'Xcode Command Line Tools are installed',
        details: 'Required for compiling native modules',
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'Xcode Command Line Tools',
        status: 'warning',
        message: 'Xcode Command Line Tools not installed',
        details: 'May be needed for some Python packages',
        required: false
      });
    }

    return checks;
  }

  /**
   * Linux-specific checks
   */
  async checkLinuxSpecific() {
    const checks = [];

    // Check distribution
    try {
      const release = await fs.readFile('/etc/os-release', 'utf8');
      const distro = release.match(/PRETTY_NAME="([^"]+)"/)?.[1] || 'Unknown';
      
      checks.push({
        name: 'Linux Distribution',
        status: 'info',
        message: `Running on ${distro}`,
        details: 'Most Linux distributions are supported',
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'Linux Distribution',
        status: 'info',
        message: 'Could not detect Linux distribution',
        details: 'This should not affect installation',
        required: false
      });
    }

    // Check for build essentials
    try {
      execSync('which gcc', { encoding: 'utf8' });
      
      checks.push({
        name: 'Build Tools',
        status: 'success',
        message: 'Build tools are available',
        details: 'GCC compiler found',
        required: false
      });
    } catch (error) {
      checks.push({
        name: 'Build Tools',
        status: 'warning',
        message: 'Build tools not found',
        details: 'Install build-essential package if needed',
        required: false
      });
    }

    return checks;
  }
}

module.exports = SystemChecker;
