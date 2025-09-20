import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import { ApiResponse, ApiError, ClientConfig } from '../types';

export class EngiVaultError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'EngiVaultError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class EngiVaultClient {
  private http: AxiosInstance;
  private apiKey?: string;
  private baseURL: string;

  constructor(config: ClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.ENGIVAULT_API_KEY;
    this.baseURL = config.baseURL || process.env.ENGIVAULT_BASE_URL || 'https://engivault-api.railway.app';

    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'engivault-js/1.0.0',
      },
    });

    // Add API key to requests if available
    if (this.apiKey) {
      this.http.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Request interceptor for retries
    this.setupRetries(config.retries || 3);

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const apiError = error.response.data as ApiError;
          throw new EngiVaultError(
            apiError.error?.message || 'API request failed',
            error.response.status,
            apiError.error?.code || 'API_ERROR'
          );
        }
        throw new EngiVaultError(
          error.message || 'Network error',
          error.response?.status || 500,
          'NETWORK_ERROR'
        );
      }
    );
  }

  private setupRetries(maxRetries: number) {
    let retryCount = 0;
    
    this.http.interceptors.response.use(
      (response) => {
        retryCount = 0;
        return response;
      },
      async (error) => {
        if (retryCount < maxRetries && this.shouldRetry(error)) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.http.request(error.config);
        }
        retryCount = 0;
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx status codes
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.http.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return response.data.data;
    } catch (error) {
      if (error instanceof EngiVaultError) {
        throw error;
      }
      throw new EngiVaultError('Unexpected error occurred');
    }
  }

  // Health check
  async health(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  }> {
    return this.request('GET', '/health');
  }

  // Set API key after initialization
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.http.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }

  // Remove API key
  clearApiKey(): void {
    this.apiKey = undefined;
    delete this.http.defaults.headers.common['Authorization'];
  }

  // Get current configuration
  getConfig(): { baseURL: string; hasApiKey: boolean } {
    return {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
    };
  }
}
