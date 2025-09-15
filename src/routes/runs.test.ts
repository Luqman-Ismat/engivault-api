import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../index';
import { transcriptService } from '@/services/runs';

describe('Runs Routes', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    transcriptService.clearAll();
  });

  describe('GET /api/v1/runs/:id', () => {
    it('should retrieve a specific transcript', async () => {
      // Create a test transcript
      const testTranscript = transcriptService.createTranscript('test-id', {
        endpoint: '/api/v1/test',
        method: 'POST',
        normalizedInputs: { test: 'data' },
        selectedEquations: ['equation1'],
        intermediateValues: { step1: 10 },
        warnings: [{ type: 'warning', message: 'test', severity: 'low' }],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test-method',
          units: { length: 'm' },
        },
        result: { success: true },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/runs/test-id',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.id).toBe('test-id');
      expect(result.endpoint).toBe('/api/v1/test');
      expect(result.method).toBe('POST');
      expect(result.normalizedInputs).toEqual({ test: 'data' });
      expect(result.selectedEquations).toEqual(['equation1']);
      expect(result.intermediateValues).toEqual({ step1: 10 });
      expect(result.warnings).toHaveLength(1);
      expect(result.meta.processingTime).toBe(100);
      expect(result.result).toEqual({ success: true });
    });

    it('should return 404 for non-existent transcript', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/runs/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Transcript not found');
      expect(result.id).toBe('non-existent-id');
    });
  });

  describe('GET /api/v1/runs', () => {
    it('should list all transcripts', async () => {
      // Create test transcripts
      transcriptService.createTranscript('id1', {
        endpoint: '/api/v1/test1',
        method: 'GET',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 50,
          inputValidation: true,
          calculationMethod: 'test1',
          units: {},
        },
        result: {},
      });

      transcriptService.createTranscript('id2', {
        endpoint: '/api/v1/test2',
        method: 'POST',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test2',
          units: {},
        },
        result: {},
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/runs',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.count).toBe(2);
      expect(result.transcripts).toHaveLength(2);

      const transcript1 = result.transcripts.find(
        (t: { id: string }) => t.id === 'id1'
      );
      const transcript2 = result.transcripts.find(
        (t: { id: string }) => t.id === 'id2'
      );

      expect(transcript1).toBeDefined();
      expect(transcript1.endpoint).toBe('/api/v1/test1');
      expect(transcript1.method).toBe('GET');
      expect(transcript1.calculationMethod).toBe('test1');
      expect(transcript1.processingTime).toBe(50);

      expect(transcript2).toBeDefined();
      expect(transcript2.endpoint).toBe('/api/v1/test2');
      expect(transcript2.method).toBe('POST');
      expect(transcript2.calculationMethod).toBe('test2');
      expect(transcript2.processingTime).toBe(100);
    });

    it('should return empty list when no transcripts exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/runs',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.count).toBe(0);
      expect(result.transcripts).toHaveLength(0);
    });
  });

  describe('DELETE /api/v1/runs/:id', () => {
    it('should delete a specific transcript', async () => {
      // Create a test transcript
      transcriptService.createTranscript('delete-test', {
        endpoint: '/api/v1/test',
        method: 'POST',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test',
          units: {},
        },
        result: {},
      });

      expect(transcriptService.getCount()).toBe(1);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/runs/delete-test',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.message).toBe('Transcript deleted successfully');
      expect(result.id).toBe('delete-test');

      expect(transcriptService.getCount()).toBe(0);
      expect(transcriptService.getTranscript('delete-test')).toBeUndefined();
    });

    it('should return 404 for non-existent transcript', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/runs/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Transcript not found');
      expect(result.id).toBe('non-existent-id');
    });
  });

  describe('DELETE /api/v1/runs', () => {
    it('should clear all transcripts', async () => {
      // Create test transcripts
      transcriptService.createTranscript('id1', {
        endpoint: '/api/v1/test1',
        method: 'GET',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 50,
          inputValidation: true,
          calculationMethod: 'test1',
          units: {},
        },
        result: {},
      });

      transcriptService.createTranscript('id2', {
        endpoint: '/api/v1/test2',
        method: 'POST',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test2',
          units: {},
        },
        result: {},
      });

      expect(transcriptService.getCount()).toBe(2);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/runs',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.message).toBe('All transcripts cleared successfully');
      expect(result.deletedCount).toBe(2);

      expect(transcriptService.getCount()).toBe(0);
    });

    it('should handle clearing when no transcripts exist', async () => {
      expect(transcriptService.getCount()).toBe(0);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/runs',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.message).toBe('All transcripts cleared successfully');
      expect(result.deletedCount).toBe(0);
    });
  });
});
