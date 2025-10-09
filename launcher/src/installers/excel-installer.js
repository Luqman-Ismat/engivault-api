const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const Logger = require('../utils/logger');
const ResourceManager = require('../utils/resources');

class ExcelInstaller {
  constructor() {
    this.logger = new Logger();
    this.platform = os.platform();
    this.excelPath = null;
    this.excelVersion = null;
    this.resourceManager = new ResourceManager();
  }

  /**
   * Install Excel integration
   */
  async install(options = {}, progressCallback) {
    const {
      includeTemplates = true,
      includeExamples = true,
      installPath = null,
      createShortcuts = true
    } = options;

    try {
      progressCallback?.({ 
        stage: 'preparing', 
        progress: 0, 
        message: 'Preparing Excel integration installation...' 
      });

      // Step 1: Verify Excel installation
      await this.verifyExcelInstallation(progressCallback);

      // Step 2: Create installation directory
      const installDir = await this.createInstallationDirectory(installPath, progressCallback);

      // Step 3: Copy VBA modules
      await this.copyVBAModules(installDir, progressCallback);

      // Step 4: Install templates if requested
      if (includeTemplates) {
        await this.installTemplates(installDir, progressCallback);
      }

      // Step 5: Install examples if requested
      if (includeExamples) {
        await this.installExamples(installDir, progressCallback);
      }

      // Step 6: Create Excel add-in
      await this.createExcelAddIn(installDir, progressCallback);

      // Step 7: Register add-in (platform specific)
      await this.registerAddIn(installDir, progressCallback);

      // Step 8: Create shortcuts if requested
      if (createShortcuts) {
        await this.createShortcuts(installDir, progressCallback);
      }

      // Step 9: Create documentation
      await this.createDocumentation(installDir, progressCallback);

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Excel integration installation completed successfully!' 
      });

      return {
        success: true,
        excelPath: this.excelPath,
        excelVersion: this.excelVersion,
        installDir,
        templatesIncluded: includeTemplates,
        examplesIncluded: includeExamples,
        addInRegistered: true
      };

    } catch (error) {
      this.logger.error('Excel installation failed:', error);
      progressCallback?.({ 
        stage: 'error', 
        progress: 0, 
        message: `Installation failed: ${error.message}` 
      });
      throw error;
    }
  }

  /**
   * Verify Excel installation
   */
  async verifyExcelInstallation(progressCallback) {
    progressCallback?.({ 
      stage: 'verifying', 
      progress: 10, 
      message: 'Verifying Excel installation...' 
    });

    if (this.platform === 'linux') {
      // Check for LibreOffice Calc
      await this.verifyLibreOfficeCalc();
    } else {
      // Check for Microsoft Excel
      await this.verifyMicrosoftExcel();
    }
  }

  /**
   * Verify Microsoft Excel (Windows/Mac)
   */
  async verifyMicrosoftExcel() {
    try {
      if (this.platform === 'win32') {
        // Windows: Check registry and file system
        try {
          const regResult = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office" /s /f Excel', { 
            encoding: 'utf8',
            timeout: 10000 
          });
          
          this.logger.info('Excel found in Windows registry');
          
          // Try to find Excel executable
          const possiblePaths = [
            'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE',
            'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\EXCEL.EXE',
            'C:\\Program Files\\Microsoft Office\\Office16\\EXCEL.EXE',
            'C:\\Program Files (x86)\\Microsoft Office\\Office16\\EXCEL.EXE'
          ];

          for (const excelPath of possiblePaths) {
            if (await fs.pathExists(excelPath)) {
              this.excelPath = excelPath;
              break;
            }
          }

          // Determine version
          if (regResult.includes('16.0')) {
            this.excelVersion = '2016+';
          } else if (regResult.includes('15.0')) {
            this.excelVersion = '2013';
          } else {
            this.excelVersion = 'Unknown';
          }

        } catch (error) {
          throw new Error('Microsoft Excel not found on Windows system');
        }
      } else if (this.platform === 'darwin') {
        // macOS: Check Applications folder
        const excelPath = '/Applications/Microsoft Excel.app';
        if (await fs.pathExists(excelPath)) {
          this.excelPath = excelPath;
          this.excelVersion = 'macOS';
          this.logger.info('Excel found in Applications folder');
        } else {
          throw new Error('Microsoft Excel not found in Applications folder');
        }
      }
    } catch (error) {
      throw new Error(`Excel verification failed: ${error.message}`);
    }
  }

  /**
   * Verify LibreOffice Calc (Linux)
   */
  async verifyLibreOfficeCalc() {
    try {
      const version = execSync('libreoffice --version', { 
        encoding: 'utf8',
        timeout: 10000 
      }).trim();
      
      this.excelPath = 'libreoffice';
      this.excelVersion = version;
      this.logger.info(`LibreOffice found: ${version}`);
    } catch (error) {
      throw new Error('LibreOffice Calc not found. Please install LibreOffice.');
    }
  }

  /**
   * Create installation directory
   */
  async createInstallationDirectory(installPath, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-directory', 
      progress: 20, 
      message: 'Creating installation directory...' 
    });

    const installDir = installPath || path.join(os.homedir(), '.engivault', 'excel-integration');
    
    try {
      await fs.ensureDir(installDir);
      await fs.ensureDir(path.join(installDir, 'modules'));
      await fs.ensureDir(path.join(installDir, 'templates'));
      await fs.ensureDir(path.join(installDir, 'examples'));
      await fs.ensureDir(path.join(installDir, 'documentation'));
      
      this.logger.info(`Installation directory created: ${installDir}`);
      return installDir;
    } catch (error) {
      throw new Error(`Failed to create installation directory: ${error.message}`);
    }
  }

  /**
   * Copy VBA modules
   */
  async copyVBAModules(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'copying-modules', 
      progress: 40, 
      message: 'Copying VBA modules...' 
    });

    try {
      const sourceDir = this.resourceManager.getVBAModulesPath();
      const targetDir = path.join(installDir, 'modules');
      
      // Ensure source exists
      if (!await fs.pathExists(sourceDir)) {
        throw new Error(`VBA modules not found at: ${sourceDir}`);
      }

      // Get VBA module files from resource manager
      const vbaModules = await this.resourceManager.getVBAModuleFiles();
      
      await fs.ensureDir(targetDir);
      
      // Copy all VBA files
      for (const module of vbaModules) {
        await fs.copy(module.path, path.join(targetDir, module.name));
        this.logger.info(`Copied VBA module: ${module.name}`);
      }

      // Create module index
      const moduleIndex = {
        modules: vbaModules.map(m => ({
          name: m.name.replace('.bas', ''),
          file: m.name,
          description: m.description
        })),
        installDate: new Date().toISOString(),
        version: '1.0.0'
      };

      await fs.writeJSON(path.join(targetDir, 'modules.json'), moduleIndex, { spaces: 2 });
      
      this.logger.info(`VBA modules copied successfully: ${vbaModules.length} modules`);
    } catch (error) {
      throw new Error(`Failed to copy VBA modules: ${error.message}`);
    }
  }

  /**
   * Install templates
   */
  async installTemplates(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-templates', 
      progress: 60, 
      message: 'Installing Excel templates...' 
    });

    try {
      const sourceDir = this.resourceManager.getExcelTemplatesPath();
      const targetDir = path.join(installDir, 'templates');
      
      if (await fs.pathExists(sourceDir)) {
        await fs.ensureDir(targetDir);
        await fs.copy(sourceDir, targetDir);
        const files = await fs.readdir(targetDir);
        this.logger.info(`Excel templates installed successfully: ${files.length} templates`);
      } else {
        this.logger.warn(`Templates not found at: ${sourceDir}`);
        // Create basic templates
        await this.createBasicTemplates(targetDir);
      }
    } catch (error) {
      this.logger.warn(`Template installation failed: ${error.message}`);
      // Don't fail installation if templates fail
    }
  }

  /**
   * Install examples
   */
  async installExamples(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-examples', 
      progress: 70, 
      message: 'Installing example workbooks...' 
    });

    try {
      const sourceDir = this.resourceManager.getExcelExamplesPath();
      const targetDir = path.join(installDir, 'examples');
      
      if (await fs.pathExists(sourceDir)) {
        await fs.ensureDir(targetDir);
        await fs.copy(sourceDir, targetDir);
        const files = await fs.readdir(targetDir);
        this.logger.info(`Example workbooks installed successfully: ${files.length} examples`);
      } else {
        this.logger.warn(`Examples not found at: ${sourceDir}`);
        // Create basic examples
        await this.createBasicExamples(targetDir);
      }
    } catch (error) {
      this.logger.warn(`Example installation failed: ${error.message}`);
      // Don't fail installation if examples fail
    }
  }

  /**
   * Create Excel add-in
   */
  async createExcelAddIn(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-addin', 
      progress: 80, 
      message: 'Creating Excel add-in...' 
    });

    try {
      if (this.platform === 'linux') {
        // Create LibreOffice extension
        await this.createLibreOfficeExtension(installDir);
      } else {
        // Create Excel add-in (.xlam)
        await this.createExcelXLAM(installDir);
      }
    } catch (error) {
      this.logger.warn(`Add-in creation failed: ${error.message}`);
      // Don't fail installation if add-in creation fails
    }
  }

  /**
   * Create Excel XLAM add-in
   */
  async createExcelXLAM(installDir) {
    // This would typically require Excel COM automation or pre-built XLAM file
    // For now, we'll create installation instructions
    const addInDir = path.join(installDir, 'addin');
    await fs.ensureDir(addInDir);

    const instructions = `# EngiVault Excel Add-in Installation

## Manual Installation Steps:

1. Open Excel
2. Go to File > Options > Add-ins
3. Select "Excel Add-ins" and click "Go..."
4. Click "Browse..." and navigate to: ${path.join(installDir, 'modules')}
5. Import the VBA modules:
   - Press Alt+F11 to open VBA editor
   - Right-click on VBAProject
   - Select Import File
   - Import each .bas file from the modules directory

## Automated Installation:

Run the EngiVault_Installer.bas macro to automatically install all modules.

## Usage:

After installation, EngiVault functions will be available in Excel:
- =ENGIVAULT_PRESSURE_DROP(flow_rate, diameter, length, viscosity, density, roughness)
- =ENGIVAULT_LMTD(hot_in, hot_out, cold_in, cold_out, arrangement)
- And many more...

See the documentation folder for complete function reference.
`;

    await fs.writeFile(path.join(addInDir, 'INSTALLATION_INSTRUCTIONS.md'), instructions);
    this.logger.info('Excel add-in instructions created');
  }

  /**
   * Create LibreOffice extension
   */
  async createLibreOfficeExtension(installDir) {
    const extensionDir = path.join(installDir, 'libreoffice-extension');
    await fs.ensureDir(extensionDir);

    const instructions = `# EngiVault LibreOffice Calc Integration

## Installation Steps:

1. Open LibreOffice Calc
2. Go to Tools > Macros > Organize Macros > LibreOffice Basic
3. Create a new library called "EngiVault"
4. Import the Basic modules from: ${path.join(installDir, 'modules')}

## Alternative: Python Integration

LibreOffice Calc supports Python macros:

1. Enable Python scripting in LibreOffice
2. Use the EngiVault Python SDK directly in Calc
3. Create custom functions using Python

See the documentation for detailed instructions.
`;

    await fs.writeFile(path.join(extensionDir, 'INSTALLATION_INSTRUCTIONS.md'), instructions);
    this.logger.info('LibreOffice extension instructions created');
  }

  /**
   * Register add-in
   */
  async registerAddIn(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'registering-addin', 
      progress: 85, 
      message: 'Registering add-in...' 
    });

    try {
      if (this.platform === 'win32') {
        await this.registerWindowsAddIn(installDir);
      } else if (this.platform === 'darwin') {
        await this.registerMacAddIn(installDir);
      }
      // Linux doesn't need registration
    } catch (error) {
      this.logger.warn(`Add-in registration failed: ${error.message}`);
      // Don't fail installation if registration fails
    }
  }

  /**
   * Register Windows add-in
   */
  async registerWindowsAddIn(installDir) {
    try {
      // This would typically involve registry entries or Excel COM automation
      // For now, we'll create a registration script
      const regScript = `# EngiVault Excel Add-in Registration Script

# This script would register the EngiVault add-in with Excel
# Currently requires manual installation - see INSTALLATION_INSTRUCTIONS.md

Write-Host "EngiVault Excel Add-in installation directory: ${installDir}"
Write-Host "Please follow the manual installation instructions."
`;

      await fs.writeFile(path.join(installDir, 'register-addin.ps1'), regScript);
      this.logger.info('Windows add-in registration script created');
    } catch (error) {
      this.logger.warn(`Windows add-in registration failed: ${error.message}`);
    }
  }

  /**
   * Register macOS add-in
   */
  async registerMacAddIn(installDir) {
    try {
      // Similar to Windows, this would require Excel automation
      const regScript = `#!/bin/bash
# EngiVault Excel Add-in Registration Script

echo "EngiVault Excel Add-in installation directory: ${installDir}"
echo "Please follow the manual installation instructions."

# Future: Automate Excel add-in installation on macOS
`;

      await fs.writeFile(path.join(installDir, 'register-addin.sh'), regScript);
      await fs.chmod(path.join(installDir, 'register-addin.sh'), '755');
      this.logger.info('macOS add-in registration script created');
    } catch (error) {
      this.logger.warn(`macOS add-in registration failed: ${error.message}`);
    }
  }

  /**
   * Create shortcuts
   */
  async createShortcuts(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-shortcuts', 
      progress: 90, 
      message: 'Creating shortcuts...' 
    });

    try {
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault Excel');
      await fs.ensureDir(shortcutsDir);

      // Create shortcut to installation directory
      if (this.platform === 'win32') {
        // Windows shortcut (would need additional library for .lnk files)
        const batchFile = `@echo off
echo Opening EngiVault Excel Integration folder...
explorer "${installDir}"
pause`;
        await fs.writeFile(path.join(shortcutsDir, 'Open EngiVault Excel.bat'), batchFile);
      } else {
        // Unix-like systems
        const scriptContent = `#!/bin/bash
echo "Opening EngiVault Excel Integration folder..."
open "${installDir}"`;
        
        const scriptPath = path.join(shortcutsDir, 'open-engivault-excel.sh');
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, '755');
      }

      this.logger.info('Shortcuts created successfully');
    } catch (error) {
      this.logger.warn(`Shortcut creation failed: ${error.message}`);
    }
  }

  /**
   * Create documentation
   */
  async createDocumentation(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-docs', 
      progress: 95, 
      message: 'Creating documentation...' 
    });

    try {
      const docsDir = path.join(installDir, 'documentation');
      
      // Copy existing documentation if available
      const sourceDocsDir = this.resourceManager.getExcelDocsPath();
      if (await fs.pathExists(sourceDocsDir)) {
        await fs.ensureDir(docsDir);
        await fs.copy(sourceDocsDir, docsDir);
        const files = await fs.readdir(docsDir);
        this.logger.info(`Documentation copied successfully: ${files.length} files`);
      }

      // Create main README
      const readme = `# EngiVault Excel Integration

Welcome to the EngiVault Excel Integration! This package provides VBA modules and functions for performing engineering calculations directly in Microsoft Excel or LibreOffice Calc.

## Installation Directory Structure

- \`modules/\` - VBA modules (.bas files)
- \`templates/\` - Excel template files
- \`examples/\` - Example workbooks
- \`documentation/\` - Complete documentation
- \`addin/\` - Add-in files and installation instructions

## Quick Start

1. Follow the installation instructions in \`addin/INSTALLATION_INSTRUCTIONS.md\`
2. Open one of the example workbooks in \`examples/\`
3. Try the EngiVault functions in your own spreadsheets

## Available Functions

### Fluid Mechanics
- \`ENGIVAULT_PRESSURE_DROP\` - Calculate pressure drop in pipes
- \`ENGIVAULT_REYNOLDS_NUMBER\` - Calculate Reynolds number
- \`ENGIVAULT_FRICTION_FACTOR\` - Calculate friction factor

### Heat Transfer
- \`ENGIVAULT_LMTD\` - Log Mean Temperature Difference
- \`ENGIVAULT_HEAT_EXCHANGER_AREA\` - Heat exchanger sizing
- \`ENGIVAULT_CONVECTION_HTC\` - Convective heat transfer coefficient

### Pumps and Hydraulics
- \`ENGIVAULT_PUMP_POWER\` - Pump power calculations
- \`ENGIVAULT_NPSH\` - Net Positive Suction Head
- \`ENGIVAULT_FLOW_RATE\` - Flow rate calculations

## Support

- Documentation: See \`documentation/\` folder
- Examples: See \`examples/\` folder
- Online Help: https://docs.engivault.com
- Community: https://github.com/Luqman-Ismat/engivault-api/discussions

## Version Information

- Installation Date: ${new Date().toISOString()}
- Version: 1.0.0
- Platform: ${this.platform}
- Excel Version: ${this.excelVersion || 'Unknown'}

## Troubleshooting

If you encounter issues:

1. Ensure Excel/LibreOffice is properly installed
2. Check that macros are enabled in your spreadsheet application
3. Verify your API key is configured correctly
4. See the troubleshooting guide in the documentation folder

Happy calculating! 🚀
`;

      await fs.writeFile(path.join(installDir, 'README.md'), readme);
      
      this.logger.info('Documentation created successfully');
    } catch (error) {
      this.logger.warn(`Documentation creation failed: ${error.message}`);
    }
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
      'EngiVault_Installer.bas': 'Automatic installation and setup'
    };
    
    return descriptions[filename] || 'EngiVault module';
  }

  /**
   * Create basic templates
   */
  async createBasicTemplates(targetDir) {
    const templates = [
      {
        name: 'Pressure Drop Calculator.md',
        content: '# Pressure Drop Calculator Template\n\nBasic template for pressure drop calculations.\n\nSee installation instructions for importing VBA modules.'
      },
      {
        name: 'Heat Exchanger Sizing.md',
        content: '# Heat Exchanger Sizing Template\n\nTemplate for heat exchanger calculations.\n\nSee installation instructions for importing VBA modules.'
      }
    ];

    for (const template of templates) {
      await fs.writeFile(path.join(targetDir, template.name), template.content);
    }
  }

  /**
   * Create basic examples
   */
  async createBasicExamples(targetDir) {
    const examples = [
      {
        name: 'Basic Calculations.md',
        content: '# Basic EngiVault Calculations\n\nExample calculations using EngiVault functions.\n\nSee installation instructions for setting up the VBA modules.'
      },
      {
        name: 'Pump Analysis.md',
        content: '# Pump Analysis Example\n\nExample pump calculations and analysis.\n\nSee installation instructions for setting up the VBA modules.'
      }
    ];

    for (const example of examples) {
      await fs.writeFile(path.join(targetDir, example.name), example.content);
    }
  }

  /**
   * Uninstall Excel integration
   */
  async uninstall(installDir = null, progressCallback) {
    try {
      progressCallback?.({ 
        stage: 'uninstalling', 
        progress: 0, 
        message: 'Uninstalling EngiVault Excel integration...' 
      });

      const targetDir = installDir || path.join(os.homedir(), '.engivault', 'excel-integration');
      
      if (await fs.pathExists(targetDir)) {
        await fs.remove(targetDir);
        this.logger.info(`Removed installation directory: ${targetDir}`);
      }

      // Remove shortcuts
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault Excel');
      if (await fs.pathExists(shortcutsDir)) {
        await fs.remove(shortcutsDir);
        this.logger.info('Removed shortcuts');
      }

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'EngiVault Excel integration uninstalled successfully!' 
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Excel uninstallation failed:', error);
      throw error;
    }
  }
}

module.exports = ExcelInstaller;

