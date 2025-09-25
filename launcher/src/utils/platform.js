const os = require('os');
const path = require('path');

class PlatformUtils {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
  }

  /**
   * Get platform-specific information
   */
  getPlatformInfo() {
    return {
      platform: this.platform,
      arch: this.arch,
      isWindows: this.platform === 'win32',
      isMac: this.platform === 'darwin',
      isLinux: this.platform === 'linux',
      homeDir: os.homedir(),
      tmpDir: os.tmpdir()
    };
  }

  /**
   * Get default installation paths for each platform
   */
  getDefaultInstallPaths() {
    const homeDir = os.homedir();
    
    switch (this.platform) {
      case 'win32':
        return {
          engivault: path.join(homeDir, 'AppData', 'Local', 'ENGiVAULT'),
          python: path.join(homeDir, 'AppData', 'Local', 'ENGiVAULT', 'python'),
          npm: path.join(homeDir, 'AppData', 'Local', 'ENGiVAULT', 'js'),
          excel: path.join(homeDir, 'AppData', 'Local', 'ENGiVAULT', 'excel')
        };
      case 'darwin':
        return {
          engivault: path.join(homeDir, '.engivault'),
          python: path.join(homeDir, '.engivault', 'python'),
          npm: path.join(homeDir, '.engivault', 'js'),
          excel: path.join(homeDir, '.engivault', 'excel')
        };
      default: // Linux
        return {
          engivault: path.join(homeDir, '.engivault'),
          python: path.join(homeDir, '.engivault', 'python'),
          npm: path.join(homeDir, '.engivault', 'js'),
          excel: path.join(homeDir, '.engivault', 'excel')
        };
    }
  }

  /**
   * Get platform-specific executable extensions
   */
  getExecutableExtension() {
    return this.platform === 'win32' ? '.exe' : '';
  }

  /**
   * Get platform-specific script extensions
   */
  getScriptExtension() {
    return this.platform === 'win32' ? '.bat' : '.sh';
  }
}

module.exports = PlatformUtils;

