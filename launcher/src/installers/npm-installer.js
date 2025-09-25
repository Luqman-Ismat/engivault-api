const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const Logger = require('../utils/logger');

class NPMInstaller {
  constructor() {
    this.logger = new Logger();
    this.platform = os.platform();
    this.npmCommand = this.detectNPMCommand();
    this.nodeCommand = this.detectNodeCommand();
  }

  /**
   * Detect the correct NPM command for this system
   */
  detectNPMCommand() {
    const commands = ['npm', 'pnpm', 'yarn'];
    
    for (const cmd of commands) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8', timeout: 5000 });
        if (version.trim()) {
          this.logger.info(`Found package manager: ${cmd}`);
          return cmd;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.logger.warn('No package manager found');
    return 'npm'; // Default fallback
  }

  /**
   * Detect the correct Node command for this system
   */
  detectNodeCommand() {
    const commands = ['node', 'nodejs'];
    
    for (const cmd of commands) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8', timeout: 5000 });
        if (version.includes('v')) {
          this.logger.info(`Found Node.js command: ${cmd}`);
          return cmd;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.logger.warn('No Node.js command found');
    return 'node'; // Default fallback
  }

  /**
   * Install the EngiVault NPM package
   */
  async install(options = {}, progressCallback) {
    const {
      global = true,
      includeTypes = true,
      installPath = null,
      version = 'latest',
      packageManager = this.npmCommand
    } = options;

    try {
      progressCallback?.({ 
        stage: 'preparing', 
        progress: 0, 
        message: 'Preparing NPM package installation...' 
      });

      // Step 1: Verify Node.js and npm
      await this.verifyNodeEnvironment(progressCallback);

      // Step 2: Upgrade npm if needed
      await this.upgradePackageManager(packageManager, progressCallback);

      // Step 3: Create project directory if local install
      let projectPath = null;
      if (!global && installPath) {
        projectPath = await this.createProjectDirectory(installPath, progressCallback);
      }

      // Step 4: Install the package
      await this.installPackage(version, global, projectPath, packageManager, progressCallback);

      // Step 5: Install TypeScript definitions if requested
      if (includeTypes) {
        await this.installTypeDefinitions(global, projectPath, packageManager, progressCallback);
      }

      // Step 6: Verify installation
      await this.verifyInstallation(global, projectPath, progressCallback);

      // Step 7: Create examples and documentation
      await this.createExamples(projectPath, progressCallback);

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'NPM package installation completed successfully!' 
      });

      return {
        success: true,
        nodeCommand: this.nodeCommand,
        npmCommand: this.npmCommand,
        packageManager,
        global,
        projectPath,
        installedVersion: await this.getInstalledVersion(global, projectPath),
        typesIncluded: includeTypes
      };

    } catch (error) {
      this.logger.error('NPM installation failed:', error);
      progressCallback?.({ 
        stage: 'error', 
        progress: 0, 
        message: `Installation failed: ${error.message}` 
      });
      throw error;
    }
  }

  /**
   * Verify Node.js environment
   */
  async verifyNodeEnvironment(progressCallback) {
    progressCallback?.({ 
      stage: 'verifying', 
      progress: 10, 
      message: 'Verifying Node.js environment...' 
    });

    try {
      // Check Node.js version
      const nodeVersion = execSync(`${this.nodeCommand} --version`, { 
        encoding: 'utf8',
        timeout: 10000 
      }).trim();
      
      this.logger.info(`Node.js version: ${nodeVersion}`);

      // Check npm version
      const npmVersion = execSync(`${this.npmCommand} --version`, { 
        encoding: 'utf8',
        timeout: 10000 
      }).trim();
      
      this.logger.info(`Package manager version: ${npmVersion}`);

      // Verify minimum versions
      const nodeVersionNumber = nodeVersion.replace('v', '');
      if (!this.isVersionSupported(nodeVersionNumber, '14.0.0')) {
        throw new Error(`Node.js 14+ is required. Found: ${nodeVersionNumber}`);
      }

    } catch (error) {
      throw new Error(`Node.js environment verification failed: ${error.message}`);
    }
  }

  /**
   * Upgrade package manager to latest version
   */
  async upgradePackageManager(packageManager, progressCallback) {
    progressCallback?.({ 
      stage: 'upgrading-npm', 
      progress: 20, 
      message: `Upgrading ${packageManager}...` 
    });

    try {
      if (packageManager === 'npm') {
        const upgradeCommand = `npm install -g npm@latest`;
        
        await this.executeCommand(upgradeCommand, {
          onData: (data) => {
            this.logger.info(`npm upgrade: ${data}`);
          }
        });

        this.logger.info('npm upgraded successfully');
      }
      // Skip upgrade for yarn and pnpm as they handle updates differently
    } catch (error) {
      this.logger.warn(`Failed to upgrade ${packageManager}: ${error.message}`);
      // Don't fail the installation if upgrade fails
    }
  }

  /**
   * Create project directory for local installation
   */
  async createProjectDirectory(installPath, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-project', 
      progress: 30, 
      message: 'Creating project directory...' 
    });

    const projectPath = installPath || path.join(os.homedir(), '.engivault', 'js-project');
    
    try {
      await fs.ensureDir(projectPath);
      
      // Create package.json if it doesn't exist
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        const packageJson = {
          name: 'engivault-project',
          version: '1.0.0',
          description: 'EngiVault JavaScript SDK project',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            test: 'echo "No tests specified"'
          },
          dependencies: {},
          devDependencies: {}
        };
        
        await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      }

      this.logger.info(`Project directory created at: ${projectPath}`);
      return projectPath;
    } catch (error) {
      throw new Error(`Failed to create project directory: ${error.message}`);
    }
  }

  /**
   * Install the EngiVault package
   */
  async installPackage(version, global, projectPath, packageManager, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-package', 
      progress: 50, 
      message: 'Installing EngiVault NPM package...' 
    });

    try {
      // Build package specifier
      let packageSpec = 'engivault';
      if (version && version !== 'latest') {
        packageSpec += `@${version}`;
      }

      // Build install command
      let installCommand;
      const globalFlag = global ? '-g' : '';
      
      switch (packageManager) {
        case 'npm':
          installCommand = `npm install ${globalFlag} ${packageSpec}`;
          break;
        case 'yarn':
          installCommand = global 
            ? `yarn global add ${packageSpec}`
            : `yarn add ${packageSpec}`;
          break;
        case 'pnpm':
          installCommand = `pnpm install ${globalFlag} ${packageSpec}`;
          break;
        default:
          installCommand = `npm install ${globalFlag} ${packageSpec}`;
      }

      // Set working directory for local installs
      const cwd = !global && projectPath ? projectPath : process.cwd();
      
      await this.executeCommand(installCommand, {
        cwd,
        onData: (data) => {
          this.logger.info(`${packageManager} install: ${data}`);
          
          // Parse progress from npm output
          if (data.includes('downloading')) {
            progressCallback?.({ 
              stage: 'downloading', 
              progress: 60, 
              message: 'Downloading package...' 
            });
          } else if (data.includes('installing')) {
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
   * Install TypeScript definitions
   */
  async installTypeDefinitions(global, projectPath, packageManager, progressCallback) {
    progressCallback?.({ 
      stage: 'installing-types', 
      progress: 75, 
      message: 'Installing TypeScript definitions...' 
    });

    try {
      // EngiVault package includes its own TypeScript definitions
      // So we just need to install TypeScript itself if it's a dev dependency
      
      let installCommand;
      const devFlag = !global ? '--save-dev' : '';
      
      switch (packageManager) {
        case 'npm':
          installCommand = `npm install ${devFlag} typescript @types/node`;
          break;
        case 'yarn':
          installCommand = global 
            ? `yarn global add typescript @types/node`
            : `yarn add --dev typescript @types/node`;
          break;
        case 'pnpm':
          installCommand = `pnpm install ${devFlag} typescript @types/node`;
          break;
        default:
          installCommand = `npm install ${devFlag} typescript @types/node`;
      }

      const cwd = !global && projectPath ? projectPath : process.cwd();
      
      await this.executeCommand(installCommand, {
        cwd,
        onData: (data) => {
          this.logger.info(`TypeScript install: ${data}`);
        }
      });

      this.logger.info('TypeScript definitions installed successfully');
    } catch (error) {
      this.logger.warn(`TypeScript definitions installation failed: ${error.message}`);
      // Don't fail main installation if TypeScript install fails
    }
  }

  /**
   * Verify installation
   */
  async verifyInstallation(global, projectPath, progressCallback) {
    progressCallback?.({ 
      stage: 'verifying-install', 
      progress: 80, 
      message: 'Verifying installation...' 
    });

    try {
      // Test require/import
      const testScript = `
        try {
          const EngiVault = require('engivault');
          console.log('EngiVault package loaded successfully');
          console.log('Version:', require('engivault/package.json').version);
        } catch (error) {
          console.error('Failed to load EngiVault:', error.message);
          process.exit(1);
        }
      `;

      const scriptPath = path.join(os.tmpdir(), 'engivault-test.js');
      await fs.writeFile(scriptPath, testScript);

      const testCommand = `${this.nodeCommand} "${scriptPath}"`;
      const cwd = !global && projectPath ? projectPath : process.cwd();
      
      const result = await this.executeCommand(testCommand, { cwd });
      
      this.logger.info(`Installation verified: ${result}`);
      
      // Clean up test script
      await fs.remove(scriptPath);
    } catch (error) {
      throw new Error(`Installation verification failed: ${error.message}`);
    }
  }

  /**
   * Create examples and documentation
   */
  async createExamples(projectPath, progressCallback) {
    progressCallback?.({ 
      stage: 'creating-examples', 
      progress: 90, 
      message: 'Creating examples...' 
    });

    if (!projectPath) return; // Skip for global installs

    try {
      const examplesDir = path.join(projectPath, 'examples');
      await fs.ensureDir(examplesDir);

      // Create basic JavaScript example
      const jsExample = `const { EngiVault } = require('engivault');

// Initialize the client
const client = new EngiVault({
  apiKey: process.env.ENGIVAULT_API_KEY || 'your-api-key-here'
});

async function basicExample() {
  try {
    // Health check
    console.log('Checking API health...');
    const health = await client.health();
    console.log('API Status:', health.status);

    // Fluid mechanics calculation
    console.log('\\n--- Fluid Mechanics Example ---');
    const result = await client.fluidMechanics.openChannelFlow({
      flowRate: 10.0,           // m³/s
      channelWidth: 5.0,        // m
      channelSlope: 0.001,      // dimensionless
      manningSCoeff: 0.03,      // Manning's n
      channelShape: 'rectangular'
    });
    
    console.log('Open Channel Flow Results:');
    console.log(\`Normal Depth: \${result.normalDepth.toFixed(3)} m\`);
    console.log(\`Velocity: \${result.velocity.toFixed(3)} m/s\`);
    console.log(\`Flow Regime: \${result.flowRegime}\`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
basicExample();`;

      await fs.writeFile(path.join(examplesDir, 'basic-example.js'), jsExample);

      // Create TypeScript example
      const tsExample = `import { EngiVault, CompressibleFlowInput } from 'engivault';

const client = new EngiVault({
  apiKey: process.env.ENGIVAULT_API_KEY || 'your-api-key-here'
});

async function typescriptExample(): Promise<void> {
  try {
    const input: CompressibleFlowInput = {
      machNumber: 2.0,
      temperature: 288,  // K
      pressure: 101325,  // Pa
      gasProperties: {
        gamma: 1.4,
        gasConstant: 287,    // J/kg·K
        molecularWeight: 28.97 // kg/kmol
      },
      flowType: 'isentropic'
    };

    const result = await client.fluidMechanics.compressibleFlow(input);
    
    console.log('Compressible Flow Results:');
    console.log(\`Velocity: \${result.velocity.toFixed(1)} m/s\`);
    console.log(\`Flow Regime: \${result.flowRegime}\`);

  } catch (error) {
    console.error('Error:', error);
  }
}

typescriptExample();`;

      await fs.writeFile(path.join(examplesDir, 'typescript-example.ts'), tsExample);

      // Create README
      const readmeContent = `# EngiVault Examples

This directory contains example code showing how to use the EngiVault JavaScript SDK.

## Examples

- \`basic-example.js\` - Basic JavaScript usage
- \`typescript-example.ts\` - TypeScript usage with full type safety

## Running Examples

### JavaScript
\`\`\`bash
node examples/basic-example.js
\`\`\`

### TypeScript
\`\`\`bash
# First compile TypeScript
npx tsc examples/typescript-example.ts --outDir dist --target es2018 --module commonjs --esModuleInterop

# Then run
node dist/typescript-example.js
\`\`\`

## Environment Variables

Set your API key:
\`\`\`bash
export ENGIVAULT_API_KEY="your-api-key-here"
\`\`\`

## Documentation

Visit https://docs.engivault.com for complete documentation.
`;

      await fs.writeFile(path.join(examplesDir, 'README.md'), readmeContent);
      
      this.logger.info('Examples created successfully');
    } catch (error) {
      this.logger.warn(`Example creation failed: ${error.message}`);
      // Don't fail installation if example creation fails
    }
  }

  /**
   * Get installed package version
   */
  async getInstalledVersion(global, projectPath) {
    try {
      let command;
      let cwd = process.cwd();

      if (global) {
        command = `${this.npmCommand} list -g engivault --depth=0`;
      } else {
        command = `${this.npmCommand} list engivault --depth=0`;
        if (projectPath) {
          cwd = projectPath;
        }
      }

      const result = await this.executeCommand(command, { cwd });
      const match = result.match(/engivault@([\\d\\.]+)/);
      
      return match ? match[1] : 'unknown';
    } catch (error) {
      this.logger.warn(`Could not get installed version: ${error.message}`);
      return 'unknown';
    }
  }

  /**
   * Uninstall the EngiVault package
   */
  async uninstall(global = true, projectPath = null, progressCallback) {
    try {
      progressCallback?.({ 
        stage: 'uninstalling', 
        progress: 0, 
        message: 'Uninstalling EngiVault NPM package...' 
      });

      const globalFlag = global ? '-g' : '';
      const uninstallCommand = `${this.npmCommand} uninstall ${globalFlag} engivault`;
      const cwd = !global && projectPath ? projectPath : process.cwd();

      await this.executeCommand(uninstallCommand, { cwd });

      // Remove project directory if it was created by us
      if (projectPath && await fs.pathExists(projectPath)) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJSON(packageJsonPath);
          if (packageJson.name === 'engivault-project') {
            await fs.remove(projectPath);
            this.logger.info(`Removed project directory: ${projectPath}`);
          }
        }
      }

      progressCallback?.({ 
        stage: 'complete', 
        progress: 100, 
        message: 'EngiVault NPM package uninstalled successfully!' 
      });

      return { success: true };
    } catch (error) {
      this.logger.error('NPM uninstallation failed:', error);
      throw error;
    }
  }

  /**
   * Execute a command with proper error handling
   */
  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const { onData, timeout = 60000, cwd = process.cwd() } = options;
      
      this.logger.info(`Executing: ${command} (cwd: ${cwd})`);
      
      const child = spawn(command, [], { 
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd
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

module.exports = NPMInstaller;

