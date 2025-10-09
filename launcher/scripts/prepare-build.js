#!/usr/bin/env node

/**
 * Prepare Build Script
 * 
 * This script prepares all necessary resources before building the Electron app:
 * 1. Builds the Python SDK distribution
 * 2. Builds the JavaScript SDK tarball
 * 3. Validates all resources are present
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '../..');
const pythonSdkDir = path.join(rootDir, 'python-sdk');
const jsSdkDir = path.join(rootDir, 'packages/engivault-js');
const excelDir = path.join(rootDir, 'excel-integration');

async function main() {
  console.log('🚀 Preparing ENGiVAULT Launcher build...\n');

  try {
    // Step 1: Check Python SDK
    console.log('📦 Step 1: Building Python SDK...');
    await buildPythonSDK();
    
    // Step 2: Check JavaScript SDK
    console.log('\n📦 Step 2: Building JavaScript SDK...');
    await buildJavaScriptSDK();
    
    // Step 3: Validate Excel resources
    console.log('\n📋 Step 3: Validating Excel resources...');
    await validateExcelResources();
    
    // Step 4: Final validation
    console.log('\n✅ Step 4: Final validation...');
    await finalValidation();
    
    console.log('\n✨ Build preparation complete!\n');
    console.log('You can now run: npm run build\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Build preparation failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

async function buildPythonSDK() {
  if (!await fs.pathExists(pythonSdkDir)) {
    console.warn('⚠️  Python SDK directory not found');
    return;
  }

  const distDir = path.join(pythonSdkDir, 'dist');
  
  // Clean old builds
  if (await fs.pathExists(distDir)) {
    console.log('  Cleaning old Python builds...');
    await fs.remove(distDir);
  }

  console.log('  Building Python package...');
  try {
    // Try using build module first
    execSync('python3 -m build', {
      cwd: pythonSdkDir,
      stdio: 'inherit'
    });
  } catch (error) {
    // Fall back to setup.py
    console.log('  Falling back to setup.py...');
    execSync('python3 setup.py sdist bdist_wheel', {
      cwd: pythonSdkDir,
      stdio: 'inherit'
    });
  }

  // Verify build
  const distFiles = await fs.readdir(distDir);
  const wheel = distFiles.find(f => f.endsWith('.whl'));
  const tarball = distFiles.find(f => f.endsWith('.tar.gz'));
  
  if (wheel || tarball) {
    console.log(`  ✅ Python SDK built successfully`);
    if (wheel) console.log(`     Wheel: ${wheel}`);
    if (tarball) console.log(`     Tarball: ${tarball}`);
  } else {
    throw new Error('Python SDK build failed - no distribution files created');
  }
}

async function buildJavaScriptSDK() {
  if (!await fs.pathExists(jsSdkDir)) {
    console.warn('⚠️  JavaScript SDK directory not found');
    return;
  }

  // Check if node_modules exists
  const nodeModulesDir = path.join(jsSdkDir, 'node_modules');
  if (!await fs.pathExists(nodeModulesDir)) {
    console.log('  Installing dependencies...');
    execSync('npm install', {
      cwd: jsSdkDir,
      stdio: 'inherit'
    });
  }

  // Build the package
  console.log('  Building JavaScript package...');
  try {
    execSync('npm run build', {
      cwd: jsSdkDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn('  ⚠️  Build script failed, skipping...');
  }

  // Create tarball
  console.log('  Creating tarball...');
  execSync('npm pack', {
    cwd: jsSdkDir,
    stdio: 'inherit'
  });

  // Verify tarball
  const files = await fs.readdir(jsSdkDir);
  const tarball = files.find(f => f.match(/^engivault-.*\.tgz$/));
  
  if (tarball) {
    console.log(`  ✅ JavaScript SDK packaged successfully: ${tarball}`);
  } else {
    throw new Error('JavaScript SDK packaging failed - no tarball created');
  }
}

async function validateExcelResources() {
  if (!await fs.pathExists(excelDir)) {
    throw new Error('Excel integration directory not found');
  }

  const vbaModulesDir = path.join(excelDir, 'vba-modules');
  const templatesDir = path.join(excelDir, 'templates');
  const examplesDir = path.join(excelDir, 'examples');
  const docsDir = path.join(excelDir, 'documentation');

  // Check VBA modules
  if (await fs.pathExists(vbaModulesDir)) {
    const basFiles = (await fs.readdir(vbaModulesDir)).filter(f => f.endsWith('.bas'));
    console.log(`  ✅ VBA modules: ${basFiles.length} files`);
  } else {
    throw new Error('VBA modules directory not found');
  }

  // Check templates
  if (await fs.pathExists(templatesDir)) {
    const templates = await fs.readdir(templatesDir);
    console.log(`  ✅ Templates: ${templates.length} files`);
  } else {
    console.warn('  ⚠️  Templates directory not found');
  }

  // Check examples
  if (await fs.pathExists(examplesDir)) {
    const examples = await fs.readdir(examplesDir);
    console.log(`  ✅ Examples: ${examples.length} files`);
  } else {
    console.warn('  ⚠️  Examples directory not found');
  }

  // Check documentation
  if (await fs.pathExists(docsDir)) {
    const docs = await fs.readdir(docsDir);
    console.log(`  ✅ Documentation: ${docs.length} files`);
  } else {
    console.warn('  ⚠️  Documentation directory not found');
  }
}

async function finalValidation() {
  const issues = [];

  // Check Python SDK dist
  const pythonDist = path.join(pythonSdkDir, 'dist');
  if (!await fs.pathExists(pythonDist)) {
    issues.push('Python SDK distribution not found');
  }

  // Check JavaScript SDK tarball
  if (await fs.pathExists(jsSdkDir)) {
    const files = await fs.readdir(jsSdkDir);
    const tarball = files.find(f => f.match(/^engivault-.*\.tgz$/));
    if (!tarball) {
      issues.push('JavaScript SDK tarball not found');
    }
  }

  // Check VBA modules
  const vbaModules = path.join(excelDir, 'vba-modules');
  if (!await fs.pathExists(vbaModules)) {
    issues.push('VBA modules directory not found');
  }

  if (issues.length > 0) {
    console.error('\n❌ Validation issues:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    throw new Error('Build validation failed');
  }

  console.log('  ✅ All resources validated successfully');
}

// Run the script
main();


