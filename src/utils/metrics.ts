import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000],
});

// Error metrics
export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'error_type'],
});

// Business logic metrics
export const calculationTotal = new Counter({
  name: 'calculation_total',
  help: 'Total number of calculations performed',
  labelNames: ['calculation_type', 'status'],
});

export const calculationDuration = new Histogram({
  name: 'calculation_duration_seconds',
  help: 'Calculation duration in seconds',
  labelNames: ['calculation_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// System metrics
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

export const cpuUsage = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
});

// Transcript metrics
export const transcriptTotal = new Counter({
  name: 'transcript_total',
  help: 'Total number of transcripts created',
  labelNames: ['endpoint'],
});

export const transcriptStorageSize = new Gauge({
  name: 'transcript_storage_size',
  help: 'Number of transcripts in storage',
});

// Batch processing metrics
export const batchProcessingTotal = new Counter({
  name: 'batch_processing_total',
  help: 'Total number of batch processing operations',
  labelNames: ['endpoint', 'status'],
});

export const batchSizeHistogram = new Histogram({
  name: 'batch_size',
  help: 'Number of items in batch requests',
  labelNames: ['endpoint'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
});

// Initialize metrics
export function initializeMetrics() {
  // Collect default metrics
  register.setDefaultLabels({
    app: 'engivault-api',
    version: process.env.npm_package_version || '1.0.0',
  });

  // Update system metrics periodically
  setInterval(() => {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);
  }, 30000); // Update every 30 seconds
}

// Initialize metrics immediately
initializeMetrics();

// Get metrics as string
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Reset metrics (useful for testing)
export function resetMetrics(): void {
  register.clear();
}

// Helper function to record request metrics
export function recordRequestMetrics(
  method: string,
  route: string,
  statusCode: number,
  duration: number,
  requestSize?: number,
  responseSize?: number
): void {
  const labels = { method, route, status_code: statusCode.toString() };

  httpRequestTotal.inc(labels);
  httpRequestDuration.observe(labels, duration / 1000); // Convert to seconds

  if (requestSize !== undefined) {
    httpRequestSize.observe({ method, route }, requestSize);
  }

  if (responseSize !== undefined) {
    httpResponseSize.observe(labels, responseSize);
  }

  if (statusCode >= 400) {
    const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
    httpErrorsTotal.inc({ method, route, error_type: errorType });
  }
}

// Helper function to record calculation metrics
export function recordCalculationMetrics(
  calculationType: string,
  duration: number,
  status: 'success' | 'error' = 'success'
): void {
  calculationTotal.inc({ calculation_type: calculationType, status });
  calculationDuration.observe(
    { calculation_type: calculationType },
    duration / 1000
  );
}

// Helper function to record transcript metrics
export function recordTranscriptMetrics(endpoint: string): void {
  transcriptTotal.inc({ endpoint });
}

// Helper function to record batch processing metrics
export function recordBatchProcessingMetrics(
  endpoint: string,
  batchSize: number,
  status: 'success' | 'partial_success' | 'error' = 'success'
): void {
  batchProcessingTotal.inc({ endpoint, status });
  batchSizeHistogram.observe({ endpoint }, batchSize);
}
