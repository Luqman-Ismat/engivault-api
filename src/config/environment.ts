export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  LOG_LEVEL: string;
  LOG_PRETTY_PRINT: boolean;
  REDACT_PII: boolean;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_TIME_WINDOW: number;
  CACHE_TTL: number;
  ENABLE_METRICS: boolean;
  ENABLE_COMPRESSION: boolean;
  ENABLE_CACHING: boolean;
}

export const config: EnvironmentConfig = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || (process.env['NODE_ENV'] === 'test' ? '3001' : '3000')),
  HOST: process.env['HOST'] || '0.0.0.0',
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  LOG_PRETTY_PRINT: process.env['LOG_PRETTY_PRINT'] === 'true',
  REDACT_PII: process.env['REDACT_PII'] !== 'false', // Default to true for security
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
  RATE_LIMIT_TIME_WINDOW: parseInt(process.env['RATE_LIMIT_TIME_WINDOW'] || '60000', 10), // 1 minute in ms
  CACHE_TTL: parseInt(process.env['CACHE_TTL'] || '600000', 10), // 10 minutes in milliseconds
  ENABLE_METRICS: process.env['ENABLE_METRICS'] !== 'false', // Default to true
  ENABLE_COMPRESSION: process.env['ENABLE_COMPRESSION'] !== 'false', // Default to true
  ENABLE_CACHING: process.env['ENABLE_CACHING'] !== 'false', // Default to true
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
