const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const Logger = require('../utils/logger');
const ResourceManager = require('../utils/resources');

class OfficeAddinInstaller {
  constructor() {
    this.logger = new Logger();
    this.platform = os.platform();
    this.resourceManager = new ResourceManager();
    this.excelPath = null;
    this.excelVersion = null;
  }

  /**
   * Install Office Add-in
   */
  async install(options = {}, progressCallback) {
    const {
      includeExamples = true,
      createShortcuts = true,
      installPath = null
    } = options;

    try {
      progressCallback?.({ 
        stage: 'preparing', 
        progress: 0, 
        message: 'Preparing Office Add-in installation...' 
      });

      // Step 1: Verify Excel installation
      await this.verifyExcelInstallation(progressCallback);

      // Step 2: Create installation directory
      const installDir = await this.createInstallationDirectory(installPath, progressCallback);

      // Step 3: Copy Office Add-in files
      await this.copyAddinFiles(installDir, progressCallback);

      // Step 4: Install examples if requested
      if (includeExamples) {
        await this.installExamples(installDir, progressCallback);
      }

      // Step 5: Setup sideload instructions
      await this.createSideloadInstructions(installDir, progressCallback);

      // Step 6: Create shortcuts if requested
      if (createShortcuts) {
        await this.createShortcuts(installDir, progressCallback);
      }

      // Step 7: Create documentation
      await this.createDocumentation(installDir, progressCallback);

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Office Add-in installation completed successfully!' 
      });

      return {
        success: true,
        excelPath: this.excelPath,
        excelVersion: this.excelVersion,
        installDir,
        manifestPath: path.join(installDir, 'manifest.xml'),
        examplesIncluded: includeExamples,
        platform: this.platform
      };

    } catch (error) {
      this.logger.error('Office Add-in installation failed:', error);
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

    if (this.platform === 'win32') {
      await this.verifyWindowsExcel();
    } else if (this.platform === 'darwin') {
      await this.verifyMacExcel();
    } else {
      // Office Add-ins don't work with LibreOffice yet
      throw new Error('Office Add-ins require Microsoft Excel (Windows/Mac) or Excel Online');
    }
  }

  /**
   * Verify Excel on Windows
   */
  async verifyWindowsExcel() {
    try {
      const regResult = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Office" /s /f Excel', { 
        encoding: 'utf8',
        timeout: 10000 
      });
      
      this.logger.info('Excel found on Windows');
      this.excelVersion = regResult.includes('16.0') ? '2016+' : 'Unknown';
    } catch (error) {
      this.logger.warn('Excel not found in registry, but Office Add-ins can also run in Excel Online');
      this.excelVersion = 'Online/Unknown';
    }
  }

  /**
   * Verify Excel on macOS
   */
  async verifyMacExcel() {
    try {
      const excelPath = '/Applications/Microsoft Excel.app';
      if (await fs.pathExists(excelPath)) {
        this.excelPath = excelPath;
        this.excelVersion = 'macOS';
        this.logger.info('Excel found in Applications folder');
      } else {
        this.logger.warn('Excel not found, but Office Add-ins can also run in Excel Online');
        this.excelVersion = 'Online/Unknown';
      }
    } catch (error) {
      this.logger.warn(`Excel verification failed: ${error.message}`);
      this.excelVersion = 'Online/Unknown';
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

    const installDir = installPath || path.join(os.homedir(), '.engivault', 'office-addin');
    
    try {
      await fs.ensureDir(installDir);
      await fs.ensureDir(path.join(installDir, 'assets'));
      await fs.ensureDir(path.join(installDir, 'examples'));
      await fs.ensureDir(path.join(installDir, 'documentation'));
      
      this.logger.info(`Installation directory created: ${installDir}`);
      return installDir;
    } catch (error) {
      throw new Error(`Failed to create installation directory: ${error.message}`);
    }
  }

  /**
   * Copy Office Add-in files
   */
  async copyAddinFiles(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'copying-files', 
      progress: 40, 
      message: 'Copying Office Add-in files...' 
    });

    try {
      const addinSource = path.join(this.resourceManager.resourcesPath, 'excel-addin');
      
      if (await fs.pathExists(addinSource)) {
        // Copy manifest
        const manifestSource = path.join(addinSource, 'manifest.xml');
        if (await fs.pathExists(manifestSource)) {
          await fs.copy(manifestSource, path.join(installDir, 'manifest.xml'));
          this.logger.info('Copied manifest.xml');
        }

        // Copy built files if they exist
        const distSource = path.join(addinSource, 'dist');
        if (await fs.pathExists(distSource)) {
          await fs.copy(distSource, path.join(installDir, 'dist'));
          this.logger.info('Copied dist files');
        }

        // Copy package.json for reference
        const packageSource = path.join(addinSource, 'package.json');
        if (await fs.pathExists(packageSource)) {
          await fs.copy(packageSource, path.join(installDir, 'package.json'));
        }
        
        this.logger.info('Office Add-in files copied successfully');
      } else {
        this.logger.warn('Office Add-in source not found, creating basic manifest');
        await this.createBasicManifest(installDir);
      }
    } catch (error) {
      throw new Error(`Failed to copy Office Add-in files: ${error.message}`);
    }
  }

  /**
   * Create basic manifest if source not available
   */
  async createBasicManifest(installDir) {
    const manifestPath = path.join(installDir, 'manifest.xml');
    
    // Check if the actual manifest exists in resources
    const resourceManifest = path.join(this.resourceManager.resourcesPath, 'excel-addin', 'manifest.xml');
    
    if (await fs.pathExists(resourceManifest)) {
      await fs.copy(resourceManifest, manifestPath);
    } else {
      // Create a minimal manifest
      const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Basic EngiVault Office Add-in Manifest -->
<!-- For full functionality, build the add-in from excel-addin/ directory -->
<OfficeApp>
  <Id>e0c79ed2-6b67-4f2c-9c4d-8c0f4a0a1b2c</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>EngiVault</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="EngiVault"/>
  <Description DefaultValue="Professional engineering calculations for Excel"/>
</OfficeApp>`;
      
      await fs.writeFile(manifestPath, manifest);
    }
  }

  /**
   * Install examples
   */
  async installExamples(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-examples', 
      progress: 60, 
      message: 'Installing example workbooks...' 
    });

    try {
      const examplesDir = path.join(installDir, 'examples');
      await fs.ensureDir(examplesDir);

      // Create example workbook template markdown
      const exampleTemplate = `# EngiVault Office Add-in Examples

## Example 1: Pressure Drop Analysis

Create a new Excel workbook and enter:

| A | B | C |
|---|---|---|
| **Parameter** | **Value** | **Unit** |
| Flow Rate | 0.01 | m³/s |
| Pipe Diameter | 0.1 | m |
| Pipe Length | 100 | m |
| Fluid Density | 1000 | kg/m³ |
| Fluid Viscosity | 0.001 | Pa·s |
| | | |
| **Pressure Drop** | =ENGIVAULT.PRESSUREDROP(B2,B3,B4,B5,B6) | Pa |

## Example 2: Pump Power Calculator

| A | B | C |
|---|---|---|
| **Parameter** | **Value** | **Unit** |
| Flow Rate | 0.05 | m³/s |
| Total Head | 50 | m |
| Efficiency | 0.8 | - |
| | | |
| **Shaft Power** | =ENGIVAULT.PUMPPOWER(B2,B3,B4) | W |
| **Power (kW)** | =B7/1000 | kW |

## Example 3: Heat Exchanger LMTD

| A | B | C |
|---|---|---|
| **Temperature** | **Value** | **Unit** |
| Hot Inlet | 373 | K |
| Hot Outlet | 323 | K |
| Cold Inlet | 293 | K |
| Cold Outlet | 333 | K |
| | | |
| **LMTD** | =ENGIVAULT.LMTD(B2,B3,B4,B5,"counterflow") | K |

## Example 4: Unit Conversions

| A | B | C |
|---|---|---|
| **Conversion** | **Formula** | **Result** |
| 100 GPM to m³/s | =ENGIVAULT.CONVERTFLOW(100,"gpm","m3/s") | m³/s |
| 100 PSI to Pa | =ENGIVAULT.CONVERTPRESSURE(100,"psi","Pa") | Pa |
| Water density @ 20°C | =ENGIVAULT.WATERDENSITY(20) | kg/m³ |
| Water viscosity @ 20°C | =ENGIVAULT.WATERVISCOSITY(20) | Pa·s |

## Tips

1. **Copy formulas across rows/columns** for batch calculations
2. **Use IFERROR** to handle calculation errors gracefully
3. **Reference cells** instead of hard-coding values for flexibility
4. **Check the task pane** for quick calculations without formulas

Happy calculating!
`;

      await fs.writeFile(path.join(examplesDir, 'Examples.md'), exampleTemplate);
      this.logger.info('Example templates created');
    } catch (error) {
      this.logger.warn(`Example installation failed: ${error.message}`);
    }
  }

  /**
   * Create sideload instructions
   */
  async createSideloadInstructions(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-instructions', 
      progress: 75, 
      message: 'Creating installation instructions...' 
    });

    const manifestPath = path.join(installDir, 'manifest.xml');
    
    const instructions = `# EngiVault Office Add-in Installation Instructions

## Method 1: Sideload in Excel (Recommended)

### Windows/Mac Desktop Excel:
1. Open Microsoft Excel
2. Go to **Insert** → **My Add-ins** (or **Get Add-ins**)
3. Click **Upload My Add-in**
4. Browse and select: \`${manifestPath}\`
5. Click **Upload**

The EngiVault add-in will now appear in your ribbon!

### Excel Online:
1. Open Excel in your web browser
2. Go to **Insert** → **Office Add-ins**
3. Click **Upload My Add-in**
4. Select: \`${manifestPath}\`

## Method 2: Network Share (Enterprise)

1. Place manifest.xml on a network share
2. Add the share to Excel's Trusted Add-in Catalogs:
   - **Windows**: File → Options → Trust Center → Trusted Add-in Catalogs
   - **Mac**: Preferences → Security & Privacy → Trust Center → Trusted Add-in Catalogs

## Method 3: AppSource (Coming Soon)

The EngiVault add-in will be available on Microsoft AppSource for one-click installation.

## Configuration

After installation:

1. Click **EngiVault** in the Excel ribbon
2. Click **Show Taskpane**
3. Enter your API key (get one at https://engivault.com)
4. Click **Save API Key**

## Using Functions

Once configured, you can use EngiVault functions in any cell:

\`\`\`excel
=ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
=ENGIVAULT.PUMPPOWER(0.05, 50, 0.8)
=ENGIVAULT.LMTD(373, 323, 293, 333, "counterflow")
\`\`\`

## Troubleshooting

### Add-in doesn't appear after upload
- Restart Excel
- Check that the manifest file is valid
- Ensure you have internet connection

### Functions show #NAME? error
- Wait a few seconds for the add-in to load
- Check that you've configured your API key
- Refresh Excel

### Functions show #VALUE! error
- Check parameter values are correct
- Ensure API key is valid
- Check internet connection

## Support

- Documentation: https://engivault.com/excel-addin
- Issues: https://github.com/Luqman-Ismat/engivault-api/issues

## Platform Support

✅ Excel 2016 and later (Windows)
✅ Excel 2016 and later (Mac)
✅ Excel Online (Browser)
✅ Excel for iPad

❌ Excel 2013 and earlier (use VBA integration instead)
❌ LibreOffice Calc (use VBA integration instead)
`;

    await fs.writeFile(path.join(installDir, 'INSTALLATION.md'), instructions);
    this.logger.info('Installation instructions created');
  }

  /**
   * Create shortcuts
   */
  async createShortcuts(installDir, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-shortcuts', 
      progress: 85, 
      message: 'Creating shortcuts...' 
    });

    try {
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault Office Add-in');
      await fs.ensureDir(shortcutsDir);

      // Create shortcut to installation directory
      if (this.platform === 'win32') {
        const batchFile = `@echo off
echo Opening EngiVault Office Add-in folder...
explorer "${installDir}"
echo.
echo Manifest file: ${path.join(installDir, 'manifest.xml')}
echo.
echo To install:
echo 1. Open Excel
echo 2. Insert -^> My Add-ins -^> Upload My Add-in
echo 3. Select the manifest.xml file
pause`;
        await fs.writeFile(path.join(shortcutsDir, 'Open EngiVault Office Add-in.bat'), batchFile);
      } else if (this.platform === 'darwin') {
        const scriptContent = `#!/bin/bash
echo "Opening EngiVault Office Add-in folder..."
open "${installDir}"
echo ""
echo "Manifest file: ${path.join(installDir, 'manifest.xml')}"
echo ""
echo "To install:"
echo "1. Open Excel"
echo "2. Insert → Get Add-ins → Upload My Add-in"
echo "3. Select the manifest.xml file"`;
        
        const scriptPath = path.join(shortcutsDir, 'open-engivault-addin.sh');
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
      const readme = `# EngiVault Office Add-in

Modern, cross-platform Excel add-in for professional engineering calculations.

## Installation Location

This add-in is installed at:
\`${installDir}\`

## Quick Start

1. **Install the Add-in**
   - See INSTALLATION.md for detailed instructions
   - Manifest file: \`manifest.xml\`

2. **Configure API Key**
   - Open Excel
   - Click "EngiVault" in ribbon → "Show Taskpane"
   - Enter your API key
   - Click "Save"

3. **Use Functions**
   - Type \`=ENGIVAULT.\` in any cell
   - Excel will show available functions
   - Select a function and enter parameters

## Available Functions

### Hydraulics
- \`ENGIVAULT.PRESSUREDROP(flowRate, diameter, length, density, viscosity)\`
- \`ENGIVAULT.VELOCITY(flowRate, diameter)\`
- \`ENGIVAULT.REYNOLDS(flowRate, diameter, density, viscosity)\`

### Pumps
- \`ENGIVAULT.PUMPPOWER(flowRate, head, efficiency)\`
- \`ENGIVAULT.NPSHA(suctionPressure, vaporPressure, density, elevationHead)\`

### Heat Transfer
- \`ENGIVAULT.LMTD(hotIn, hotOut, coldIn, coldOut, arrangement)\`
- \`ENGIVAULT.HXAREA(heatDuty, overallU, hotIn, hotOut, coldIn, coldOut)\`

### Utilities
- \`ENGIVAULT.WATERDENSITY(temperature)\`
- \`ENGIVAULT.WATERVISCOSITY(temperature)\`
- \`ENGIVAULT.CONVERTFLOW(value, fromUnit, toUnit)\`
- \`ENGIVAULT.CONVERTPRESSURE(value, fromUnit, toUnit)\`

## Examples

See the \`examples/\` directory for detailed calculation examples.

## Platform Support

✅ Excel 2016+ (Windows)
✅ Excel 2016+ (Mac)
✅ Excel Online
✅ Excel for iPad

## Installation Date

${new Date().toISOString()}

## Version

1.0.0

## Support

- Documentation: https://engivault.com/excel-addin
- GitHub: https://github.com/Luqman-Ismat/engivault-api
- Email: support@engivault.com

---

**EngiVault Office Add-in** - Engineering calculations made simple!
`;

      await fs.writeFile(path.join(installDir, 'README.md'), readme);
      this.logger.info('Documentation created successfully');
    } catch (error) {
      this.logger.warn(`Documentation creation failed: ${error.message}`);
    }
  }

  /**
   * Uninstall Office Add-in
   */
  async uninstall(installDir = null, progressCallback) {
    try {
      progressCallback?.({ 
        stage: 'uninstalling', 
        progress: 0, 
        message: 'Uninstalling EngiVault Office Add-in...' 
      });

      const targetDir = installDir || path.join(os.homedir(), '.engivault', 'office-addin');
      
      if (await fs.pathExists(targetDir)) {
        await fs.remove(targetDir);
        this.logger.info(`Removed installation directory: ${targetDir}`);
      }

      // Remove shortcuts
      const shortcutsDir = path.join(os.homedir(), 'Desktop', 'EngiVault Office Add-in');
      if (await fs.pathExists(shortcutsDir)) {
        await fs.remove(shortcutsDir);
        this.logger.info('Removed shortcuts');
      }

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Office Add-in uninstalled successfully! (Note: Remove from Excel manually)' 
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Office Add-in uninstallation failed:', error);
      throw error;
    }
  }
}

module.exports = OfficeAddinInstaller;

