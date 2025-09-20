import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = Object.keys(packageJson.dependencies || {});

const baseConfig = {
  input: 'src/index.ts',
  external,
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    })
  ]
};

const moduleConfigs = [
  'fluid-mechanics',
  'heat-transfer'
].map(module => [
  // CommonJS
  {
    ...baseConfig,
    input: `src/modules/${module}.ts`,
    output: {
      file: `dist/modules/${module}.js`,
      format: 'cjs',
      exports: 'named'
    }
  },
  // ESM
  {
    ...baseConfig,
    input: `src/modules/${module}.ts`,
    output: {
      file: `dist/modules/${module}.esm.js`,
      format: 'esm'
    }
  }
]).flat();

export default [
  // Main bundle - CommonJS
  {
    ...baseConfig,
    output: {
      file: packageJson.main,
      format: 'cjs',
      exports: 'named'
    }
  },
  // Main bundle - ESM
  {
    ...baseConfig,
    output: {
      file: packageJson.module,
      format: 'esm'
    }
  },
  // Main bundle - UMD (minified)
  {
    ...baseConfig,
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'EngiVault',
      exports: 'named'
    },
    plugins: [
      ...baseConfig.plugins,
      terser()
    ]
  },
  // Module bundles
  ...moduleConfigs,
  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.types,
      format: 'esm'
    },
    plugins: [dts()],
    external: [/\.css$/]
  },
  // Module type definitions
  ...['fluid-mechanics', 'heat-transfer'].map(module => ({
    input: `src/modules/${module}.ts`,
    output: {
      file: `dist/modules/${module}.d.ts`,
      format: 'esm'
    },
    plugins: [dts()],
    external: [/\.css$/]
  }))
];
