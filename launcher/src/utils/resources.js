const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');

/**
 * Resource Manager
 * Handles finding and accessing bundled resources in both dev and production
 */
class ResourceManager {
  constructor() {
    this.isDev = !app.isPackaged;
    this.appPath = app.getAppPath();
    this.resourcesPath = this.getResourcesPath();
  }

  /**
   * Get the base resources path
   */
  getResourcesPath() {
    if (this.isDev) {
      // In development, resources are in the project root
      return path.join(__dirname, '../../..');
    } else {
      // In production, resources are bundled in the app
      return path.join(process.resourcesPath, 'app');
    }
  }

  /**
   * Get path to Excel integration resources
   */
  getExcelResourcesPath() {
    const excelPath = path.join(this.resourcesPath, 'excel-integration');
    return excelPath;
  }

  /**
   * Get path to VBA modules
   */
  getVBAModulesPath() {
    return path.join(this.getExcelResourcesPath(), 'vba-modules');
  }

  /**
   * Get path to Excel templates
   */
  getExcelTemplatesPath() {
    return path.join(this.getExcelResourcesPath(), 'templates');
  }

  /**
   * Get path to Excel examples
   */
  getExcelExamplesPath() {
    return path.join(this.getExcelResourcesPath(), 'examples');
  }

  /**
   * Get path to Excel documentation
   */
  getExcelDocsPath() {
    return path.join(this.getExcelResourcesPath(), 'documentation');
  }

  /**
   * Get path to Python SDK
   */
  getPythonSDKPath() {
    return path.join(this.resourcesPath, 'python-sdk');
  }

  /**
   * Get path to JavaScript SDK
   */
  getJavaScriptSDKPath() {
    return path.join(this.resourcesPath, 'packages', 'engivault-js');
  }

  /**
   * Get path to Office Add-in
   */
  getOfficeAddinPath() {
    return path.join(this.resourcesPath, 'excel-addin');
  }

  /**
   * Check if a resource path exists
   */
  async resourceExists(resourcePath) {
    try {
      return await fs.pathExists(resourcePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all VBA module files
   */
  async getVBAModuleFiles() {
    const modulesPath = this.getVBAModulesPath();
    
    if (!await this.resourceExists(modulesPath)) {
      throw new Error(`VBA modules directory not found: ${modulesPath}`);
    }

    const files = await fs.readdir(modulesPath);
    return files
      .filter(file => file.endsWith('.bas'))
      .map(file => ({
        name: file,
        path: path.join(modulesPath, file),
        description: this.getModuleDescription(file)
      }));
  }

  /**
   * Get module description based on filename
   */
  getModuleDescription(filename) {
    const descriptions = {
      'EngiVaultAPI.bas': 'Core API communication module',
      'EngiVaultAPI_Enhanced.bas': 'Enhanced API module with advanced features',
      'EngiVaultFluidMechanics.bas': 'Fluid mechanics calculation functions',
      'EngiVaultHeatTransfer.bas': 'Heat transfer calculation functions',
      'EngiVaultHelpers.bas': 'Utility and helper functions',
      'EngiVaultCharts.bas': 'Chart generation and visualization',
      'EngiVaultAutomation.bas': 'Automation and batch processing',
      'EngiVault_Installer.bas': 'Automatic installation and setup',
      'EngiVaultEquipmentSizing.bas': 'Equipment sizing calculations'
    };
    
    return descriptions[filename] || 'EngiVault module';
  }

  /**
   * Copy all Excel resources to a destination
   */
  async copyExcelResources(destination) {
    const results = {
      vbaModules: [],
      templates: [],
      examples: [],
      documentation: []
    };

    // Copy VBA modules
    const vbaSource = this.getVBAModulesPath();
    const vbaTarget = path.join(destination, 'modules');
    if (await this.resourceExists(vbaSource)) {
      await fs.copy(vbaSource, vbaTarget);
      const files = await fs.readdir(vbaTarget);
      results.vbaModules = files.filter(f => f.endsWith('.bas'));
    }

    // Copy templates
    const templatesSource = this.getExcelTemplatesPath();
    const templatesTarget = path.join(destination, 'templates');
    if (await this.resourceExists(templatesSource)) {
      await fs.copy(templatesSource, templatesTarget);
      const files = await fs.readdir(templatesTarget);
      results.templates = files;
    }

    // Copy examples
    const examplesSource = this.getExcelExamplesPath();
    const examplesTarget = path.join(destination, 'examples');
    if (await this.resourceExists(examplesSource)) {
      await fs.copy(examplesSource, examplesTarget);
      const files = await fs.readdir(examplesTarget);
      results.examples = files;
    }

    // Copy documentation
    const docsSource = this.getExcelDocsPath();
    const docsTarget = path.join(destination, 'documentation');
    if (await this.resourceExists(docsSource)) {
      await fs.copy(docsSource, docsTarget);
      const files = await fs.readdir(docsTarget);
      results.documentation = files;
    }

    return results;
  }

  /**
   * Get Python SDK package tarball
   */
  async getPythonSDKPackage() {
    const sdkPath = this.getPythonSDKPath();
    
    if (!await this.resourceExists(sdkPath)) {
      return null;
    }

    // Look for built distribution files
    const distPath = path.join(sdkPath, 'dist');
    if (await this.resourceExists(distPath)) {
      const files = await fs.readdir(distPath);
      const tarball = files.find(f => f.endsWith('.tar.gz'));
      const wheel = files.find(f => f.endsWith('.whl'));
      
      return {
        sdkPath,
        distPath,
        tarball: tarball ? path.join(distPath, tarball) : null,
        wheel: wheel ? path.join(distPath, wheel) : null
      };
    }

    return {
      sdkPath,
      distPath: null,
      tarball: null,
      wheel: null
    };
  }

  /**
   * Get JavaScript SDK package tarball
   */
  async getJavaScriptSDKPackage() {
    const sdkPath = this.getJavaScriptSDKPath();
    
    if (!await this.resourceExists(sdkPath)) {
      return null;
    }

    // Look for the built package tarball
    const files = await fs.readdir(sdkPath);
    const tarball = files.find(f => f.match(/^engivault-.*\.tgz$/));
    
    return {
      sdkPath,
      tarball: tarball ? path.join(sdkPath, tarball) : null,
      packageJson: path.join(sdkPath, 'package.json')
    };
  }

  /**
   * Get installation resources info
   */
  async getInstallationInfo() {
    return {
      isDevelopment: this.isDev,
      appPath: this.appPath,
      resourcesPath: this.resourcesPath,
      excel: {
        available: await this.resourceExists(this.getExcelResourcesPath()),
        vbaModulesPath: this.getVBAModulesPath(),
        templatesPath: this.getExcelTemplatesPath(),
        examplesPath: this.getExcelExamplesPath(),
        docsPath: this.getExcelDocsPath()
      },
      officeAddin: {
        available: await this.resourceExists(this.getOfficeAddinPath()),
        path: this.getOfficeAddinPath()
      },
      python: await this.getPythonSDKPackage(),
      javascript: await this.getJavaScriptSDKPackage()
    };
  }

  /**
   * Validate all resources are present
   */
  async validateResources() {
    const validation = {
      excel: {
        vbaModules: await this.resourceExists(this.getVBAModulesPath()),
        templates: await this.resourceExists(this.getExcelTemplatesPath()),
        examples: await this.resourceExists(this.getExcelExamplesPath()),
        documentation: await this.resourceExists(this.getExcelDocsPath())
      },
      officeAddin: await this.resourceExists(this.getOfficeAddinPath()),
      python: await this.resourceExists(this.getPythonSDKPath()),
      javascript: await this.resourceExists(this.getJavaScriptSDKPath())
    };

    validation.allPresent = Object.values(validation.excel).every(v => v) &&
                           validation.officeAddin &&
                           validation.python &&
                           validation.javascript;

    return validation;
  }
}

module.exports = ResourceManager;


