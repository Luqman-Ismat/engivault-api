const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.logDir = options.logDir || path.join(os.homedir(), '.engivault', 'logs');
    this.logFile = options.logFile || 'installer.log';
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    if (this.logToFile) {
      this.initializeLogFile();
    }
  }

  /**
   * Initialize log file
   */
  async initializeLogFile() {
    try {
      await fs.ensureDir(this.logDir);
      this.logFilePath = path.join(this.logDir, this.logFile);
      
      // Rotate log file if it's too large (>10MB)
      if (await fs.pathExists(this.logFilePath)) {
        const stats = await fs.stat(this.logFilePath);
        if (stats.size > 10 * 1024 * 1024) { // 10MB
          const backupPath = path.join(this.logDir, `${this.logFile}.backup`);
          await fs.move(this.logFilePath, backupPath);
        }
      }

      // Write session header
      const header = `\n=== EngiVault Launcher Session Started ===\nTimestamp: ${new Date().toISOString()}\nPlatform: ${os.platform()}\nArch: ${os.arch()}\nNode: ${process.version}\n\n`;
      await fs.appendFile(this.logFilePath, header);
    } catch (error) {
      console.error('Failed to initialize log file:', error.message);
      this.logToFile = false;
    }
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    this.log('info', message, ...args);
  }

  /**
   * Log debug message
   */
  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  /**
   * Main logging method
   */
  log(level, message, ...args) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedMessage = this.formatMessage(level, timestamp, message, ...args);

    if (this.logToConsole) {
      this.logToConsoleMethod(level, formattedMessage);
    }

    if (this.logToFile && this.logFilePath) {
      this.logToFileMethod(formattedMessage);
    }
  }

  /**
   * Format log message
   */
  formatMessage(level, timestamp, message, ...args) {
    let formattedMessage = message;
    
    // Handle object arguments
    if (args.length > 0) {
      const formattedArgs = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      });
      formattedMessage += ' ' + formattedArgs.join(' ');
    }

    return `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`;
  }

  /**
   * Log to console with appropriate method
   */
  logToConsoleMethod(level, message) {
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }

  /**
   * Log to file
   */
  async logToFileMethod(message) {
    try {
      await fs.appendFile(this.logFilePath, message + '\n');
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to write to log file:', error.message);
      console.log(message);
    }
  }

  /**
   * Get log file contents
   */
  async getLogContents(lines = 100) {
    try {
      if (!this.logFilePath || !await fs.pathExists(this.logFilePath)) {
        return '';
      }

      const content = await fs.readFile(this.logFilePath, 'utf8');
      const logLines = content.split('\n');
      
      // Return last N lines
      return logLines.slice(-lines).join('\n');
    } catch (error) {
      this.error('Failed to read log file:', error.message);
      return '';
    }
  }

  /**
   * Clear log file
   */
  async clearLog() {
    try {
      if (this.logFilePath && await fs.pathExists(this.logFilePath)) {
        await fs.remove(this.logFilePath);
        await this.initializeLogFile();
        this.info('Log file cleared');
      }
    } catch (error) {
      this.error('Failed to clear log file:', error.message);
    }
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.info(`Log level set to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix) {
    const childLogger = new Logger({
      logLevel: this.logLevel,
      logToFile: this.logToFile,
      logToConsole: this.logToConsole,
      logDir: this.logDir,
      logFile: this.logFile
    });

    // Override the formatMessage method to include prefix
    const originalFormatMessage = childLogger.formatMessage.bind(childLogger);
    childLogger.formatMessage = (level, timestamp, message, ...args) => {
      return originalFormatMessage(level, timestamp, `[${prefix}] ${message}`, ...args);
    };

    return childLogger;
  }

  /**
   * Log installation progress
   */
  logProgress(component, stage, progress, message) {
    this.info(`[${component}] [${stage}] ${progress}% - ${message}`);
  }

  /**
   * Log system information
   */
  logSystemInfo(systemInfo) {
    this.info('System Information:', {
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      release: systemInfo.release,
      nodeVersion: systemInfo.nodejs?.version,
      memory: {
        total: Math.round(systemInfo.memory.total / 1024 / 1024) + 'MB',
        free: Math.round(systemInfo.memory.free / 1024 / 1024) + 'MB'
      }
    });
  }

  /**
   * Log error with stack trace
   */
  logError(error, context = '') {
    this.error(`${context ? context + ': ' : ''}${error.message}`);
    if (error.stack) {
      this.debug('Stack trace:', error.stack);
    }
  }

  /**
   * Create a timed operation logger
   */
  createTimer(operation) {
    const startTime = Date.now();
    this.info(`Starting operation: ${operation}`);
    
    return {
      end: (success = true) => {
        const duration = Date.now() - startTime;
        const status = success ? 'completed' : 'failed';
        this.info(`Operation ${status}: ${operation} (${duration}ms)`);
      }
    };
  }
}

module.exports = Logger;
