export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  LOG_LEVEL: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_TIME_WINDOW: number;
  
  // Database
  DATABASE_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
}

export const config: EnvironmentConfig = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '3000', 10),
  HOST: process.env['HOST'] || '0.0.0.0',
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
  RATE_LIMIT_TIME_WINDOW: parseInt(process.env['RATE_LIMIT_TIME_WINDOW'] || '60000', 10),
  
  // Database
  DATABASE_URL: process.env['DATABASE_URL'] || 'postgresql://user:password@localhost:5432/engivault',
  
  // Authentication
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '7d',
  BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';