const fs = require('fs-extra');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

/**
 * Download utility functions
 */
class DownloadManager {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Download a file from URL
   */
  async downloadFile(url, destination, options = {}) {
    const {
      onProgress,
      timeout = 30000,
      retries = 3,
      headers = {}
    } = options;

    let attempt = 0;
    while (attempt < retries) {
      try {
        this.logger?.info(`Downloading ${url} to ${destination} (attempt ${attempt + 1}/${retries})`);
        
        const { default: fetch } = await import('node-fetch');
        const response = await fetch(url, {
          headers,
          timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Ensure destination directory exists
        await fs.ensureDir(path.dirname(destination));

        // Get content length for progress tracking
        const contentLength = parseInt(response.headers.get('content-length'), 10);
        let downloadedBytes = 0;

        // Create write stream
        const fileStream = fs.createWriteStream(destination);

        // Track progress if callback provided
        if (onProgress && contentLength) {
          response.body.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const progress = Math.round((downloadedBytes / contentLength) * 100);
            onProgress(progress, downloadedBytes, contentLength);
          });
        }

        // Download file
        await streamPipeline(response.body, fileStream);

        this.logger?.info(`Successfully downloaded: ${destination}`);
        return destination;

      } catch (error) {
        attempt++;
        this.logger?.warn(`Download attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= retries) {
          throw new Error(`Failed to download ${url} after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await this.sleep(1000 * attempt);
      }
    }
  }

  /**
   * Download and extract archive
   */
  async downloadAndExtract(url, destination, options = {}) {
    const {
      onProgress,
      extractPath,
      archiveType = 'auto'
    } = options;

    try {
      // Download to temporary file
      const tempFile = path.join(require('os').tmpdir(), `engivault-download-${Date.now()}`);
      
      await this.downloadFile(url, tempFile, {
        onProgress: (progress) => {
          onProgress?.({ stage: 'downloading', progress, message: 'Downloading archive...' });
        }
      });

      // Determine archive type
      const detectedType = archiveType === 'auto' ? this.detectArchiveType(url, tempFile) : archiveType;
      
      onProgress?.({ stage: 'extracting', progress: 50, message: 'Extracting archive...' });

      // Extract archive
      const extractedPath = await this.extractArchive(tempFile, extractPath || destination, detectedType);

      // Clean up temporary file
      await fs.remove(tempFile);

      onProgress?.({ stage: 'complete', progress: 100, message: 'Download and extraction completed' });

      return extractedPath;

    } catch (error) {
      this.logger?.error('Download and extract failed:', error.message);
      throw error;
    }
  }

  /**
   * Detect archive type from URL or file
   */
  detectArchiveType(url, filePath) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.zip')) return 'zip';
    if (urlLower.includes('.tar.gz') || urlLower.includes('.tgz')) return 'tar.gz';
    if (urlLower.includes('.tar')) return 'tar';
    if (urlLower.includes('.7z')) return '7z';
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.zip': return 'zip';
      case '.gz': return 'tar.gz';
      case '.tar': return 'tar';
      case '.7z': return '7z';
      default: return 'zip'; // Default fallback
    }
  }

  /**
   * Extract archive based on type
   */
  async extractArchive(archivePath, destination, type) {
    await fs.ensureDir(destination);

    switch (type) {
      case 'zip':
        return await this.extractZip(archivePath, destination);
      case 'tar':
      case 'tar.gz':
        return await this.extractTar(archivePath, destination);
      default:
        throw new Error(`Unsupported archive type: ${type}`);
    }
  }

  /**
   * Extract ZIP archive
   */
  async extractZip(archivePath, destination) {
    try {
      const extractZip = require('extract-zip');
      await extractZip(archivePath, { dir: path.resolve(destination) });
      this.logger?.info(`ZIP extracted to: ${destination}`);
      return destination;
    } catch (error) {
      throw new Error(`ZIP extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract TAR archive
   */
  async extractTar(archivePath, destination) {
    try {
      const tar = require('tar');
      await tar.extract({
        file: archivePath,
        cwd: destination,
        strip: 1 // Remove top-level directory
      });
      this.logger?.info(`TAR extracted to: ${destination}`);
      return destination;
    } catch (error) {
      throw new Error(`TAR extraction failed: ${error.message}`);
    }
  }

  /**
   * Download multiple files concurrently
   */
  async downloadMultiple(downloads, options = {}) {
    const {
      concurrency = 3,
      onProgress,
      onFileComplete
    } = options;

    const results = [];
    const errors = [];
    let completed = 0;

    // Process downloads in batches
    for (let i = 0; i < downloads.length; i += concurrency) {
      const batch = downloads.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (download, index) => {
        try {
          const result = await this.downloadFile(download.url, download.destination, {
            onProgress: (progress, downloaded, total) => {
              onProgress?.({
                fileIndex: i + index,
                fileName: path.basename(download.destination),
                progress,
                downloaded,
                total
              });
            }
          });

          completed++;
          onFileComplete?.(result, completed, downloads.length);
          return result;

        } catch (error) {
          completed++;
          errors.push({ download, error });
          onFileComplete?.(null, completed, downloads.length, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    if (errors.length > 0) {
      this.logger?.warn(`${errors.length} downloads failed out of ${downloads.length}`);
      errors.forEach(({ download, error }) => {
        this.logger?.error(`Failed to download ${download.url}: ${error.message}`);
      });
    }

    return {
      results: results.filter(r => r !== null),
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Check if URL is accessible
   */
  async checkUrl(url, options = {}) {
    const { timeout = 10000 } = options;

    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(url, {
        method: 'HEAD',
        timeout
      });

      return {
        accessible: response.ok,
        status: response.status,
        contentLength: parseInt(response.headers.get('content-length'), 10) || 0,
        contentType: response.headers.get('content-type') || 'unknown'
      };

    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Get file size from URL
   */
  async getFileSize(url) {
    try {
      const info = await this.checkUrl(url);
      return info.accessible ? info.contentLength : 0;
    } catch (error) {
      this.logger?.warn(`Could not get file size for ${url}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Calculate download speed
   */
  calculateSpeed(bytesDownloaded, startTime) {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const bytesPerSecond = bytesDownloaded / elapsedSeconds;
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  /**
   * Estimate remaining time
   */
  estimateRemainingTime(bytesDownloaded, totalBytes, startTime) {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const bytesPerSecond = bytesDownloaded / elapsedSeconds;
    const remainingBytes = totalBytes - bytesDownloaded;
    const remainingSeconds = remainingBytes / bytesPerSecond;

    if (remainingSeconds < 60) {
      return Math.round(remainingSeconds) + 's';
    } else if (remainingSeconds < 3600) {
      return Math.round(remainingSeconds / 60) + 'm';
    } else {
      return Math.round(remainingSeconds / 3600) + 'h';
    }
  }
}

// Export both the class and convenience functions
module.exports = DownloadManager;

// Convenience functions for backwards compatibility
module.exports.download = async (url, destination, options = {}) => {
  const manager = new DownloadManager();
  return await manager.downloadFile(url, destination, options);
};

module.exports.downloadAndExtract = async (url, destination, options = {}) => {
  const manager = new DownloadManager();
  return await manager.downloadAndExtract(url, destination, options);
};
