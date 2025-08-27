import { describe, it, expect, beforeEach } from 'vitest';
import { transcriptService } from './runs';
import type { Transcript } from './runs';

describe('Transcript Service', () => {
  beforeEach(() => {
    transcriptService.clearAll();
  });

  describe('Basic Operations', () => {
    it('should create and retrieve a transcript', () => {
      const transcriptData = {
        endpoint: '/api/v1/test',
        method: 'POST',
        normalizedInputs: { test: 'data' },
        selectedEquations: ['equation1', 'equation2'],
        intermediateValues: { step1: 10, step2: 20 },
        warnings: [{ type: 'warning', message: 'test warning', severity: 'low' as const }],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test-method',
          units: { length: 'm' }
        },
        result: { success: true }
      };

      const id = transcriptService.generateId();
      const transcript = transcriptService.createTranscript(id, transcriptData);

      expect(transcript.id).toBe(id);
      expect(transcript.timestamp).toBeInstanceOf(Date);
      expect(transcript.endpoint).toBe('/api/v1/test');
      expect(transcript.method).toBe('POST');
      expect(transcript.normalizedInputs).toEqual({ test: 'data' });
      expect(transcript.selectedEquations).toEqual(['equation1', 'equation2']);
      expect(transcript.intermediateValues).toEqual({ step1: 10, step2: 20 });
      expect(transcript.warnings).toHaveLength(1);
      expect(transcript.meta.processingTime).toBe(100);
      expect(transcript.result).toEqual({ success: true });
    });

    it('should generate unique IDs', () => {
      const id1 = transcriptService.generateId();
      const id2 = transcriptService.generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^run_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^run_\d+_[a-z0-9]+$/);
    });

    it('should list all transcript IDs', () => {
      const id1 = transcriptService.generateId();
      const id2 = transcriptService.generateId();

      transcriptService.createTranscript(id1, {
        endpoint: '/test1',
        method: 'GET',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 50,
          inputValidation: true,
          calculationMethod: 'test1',
          units: {}
        },
        result: {}
      });

      transcriptService.createTranscript(id2, {
        endpoint: '/test2',
        method: 'POST',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test2',
          units: {}
        },
        result: {}
      });

      const ids = transcriptService.listTranscriptIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });

    it('should delete a transcript', () => {
      const id = transcriptService.generateId();
      transcriptService.createTranscript(id, {
        endpoint: '/test',
        method: 'GET',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 50,
          inputValidation: true,
          calculationMethod: 'test',
          units: {}
        },
        result: {}
      });

      expect(transcriptService.getCount()).toBe(1);
      
      const deleted = transcriptService.deleteTranscript(id);
      expect(deleted).toBe(true);
      expect(transcriptService.getCount()).toBe(0);
      expect(transcriptService.getTranscript(id)).toBeUndefined();
    });

    it('should clear all transcripts', () => {
      const id1 = transcriptService.generateId();
      const id2 = transcriptService.generateId();

      transcriptService.createTranscript(id1, {
        endpoint: '/test1',
        method: 'GET',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 50,
          inputValidation: true,
          calculationMethod: 'test1',
          units: {}
        },
        result: {}
      });

      transcriptService.createTranscript(id2, {
        endpoint: '/test2',
        method: 'POST',
        normalizedInputs: {},
        selectedEquations: [],
        intermediateValues: {},
        warnings: [],
        meta: {
          processingTime: 100,
          inputValidation: true,
          calculationMethod: 'test2',
          units: {}
        },
        result: {}
      });

      expect(transcriptService.getCount()).toBe(2);
      
      transcriptService.clearAll();
      expect(transcriptService.getCount()).toBe(0);
      expect(transcriptService.getTranscript(id1)).toBeUndefined();
      expect(transcriptService.getTranscript(id2)).toBeUndefined();
    });
  });

  describe('Transcript Detection', () => {
    it('should detect transcript header correctly', () => {
      const requestWithHeader = {
        headers: {
          'x-engivault-transcript': 'on'
        }
      } as any;

      const requestWithoutHeader = {
        headers: {}
      } as any;

      const requestWithWrongValue = {
        headers: {
          'x-engivault-transcript': 'off'
        }
      } as any;

      expect(transcriptService.isTranscriptEnabled(requestWithHeader)).toBe(true);
      expect(transcriptService.isTranscriptEnabled(requestWithoutHeader)).toBe(false);
      expect(transcriptService.isTranscriptEnabled(requestWithWrongValue)).toBe(false);
    });
  });

  describe('Calculation Method Detection', () => {
    it('should detect fill-drain calculation method', () => {
      const request = {
        url: '/api/v1/operations/fill-drain-time',
        method: 'POST',
        body: { test: 'data' },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.meta.calculationMethod).toBe('fill-drain-simulation');
    });

    it('should detect BEP calculation method', () => {
      const request = {
        url: '/api/v1/pumps/bep-check',
        method: 'POST',
        body: { test: 'data' },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.meta.calculationMethod).toBe('bep-distance-calculation');
    });

    it('should detect unknown calculation method', () => {
      const request = {
        url: '/api/v1/unknown-endpoint',
        method: 'POST',
        body: { test: 'data' },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.meta.calculationMethod).toBe('unknown');
    });
  });

  describe('Input Normalization', () => {
    it('should normalize inputs correctly', () => {
      const request = {
        url: '/api/v1/test',
        method: 'POST',
        body: {
          tank: {
            volume: { value: 100, unit: 'm³' },
            diameter: { value: 5, unit: 'm' }
          },
          flowRate: {
            value: { value: 0.1, unit: 'm³/s' }
          }
        },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.normalizedInputs).toEqual({
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' }
        },
        flowRate: {
          value: { value: 0.1, unit: 'm³/s' }
        }
      });
    });

    it('should handle batch inputs', () => {
      const request = {
        url: '/api/v1/test',
        method: 'POST',
        body: {
          items: [
            { tank: { volume: { value: 100, unit: 'm³' } } },
            { tank: { volume: { value: 200, unit: 'm³' } } }
          ]
        },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { results: [], errors: [] },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.normalizedInputs.items).toHaveLength(2);
      expect(transcript!.normalizedInputs.items[0].tank.volume.value).toBe(100);
      expect(transcript!.normalizedInputs.items[1].tank.volume.value).toBe(200);
    });
  });

  describe('Unit Extraction', () => {
    it('should extract units from input data', () => {
      const request = {
        url: '/api/v1/test',
        method: 'POST',
        body: {
          tank: {
            volume: { value: 100, unit: 'm³' },
            diameter: { value: 5, unit: 'm' }
          },
          flowRate: {
            value: { value: 0.1, unit: 'm³/s' }
          }
        },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.meta.units).toEqual({
        'tank.volume': 'm³',
        'tank.diameter': 'm',
        'flowRate.value': 'm³/s'
      });
    });
  });

  describe('Transcript Creation from Request', () => {
    it('should create transcript when header is present', () => {
      const request = {
        url: '/api/v1/operations/fill-drain-time',
        method: 'POST',
        body: { test: 'data' },
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const response = { totalTime: { value: 100, unit: 's' } };
      const warnings = [{ type: 'warning', message: 'test', severity: 'low' as const }];
      const intermediates = { step1: 10, step2: 20 };
      const equations = ['equation1', 'equation2'];

      const transcript = transcriptService.createFromRequest(
        request,
        response,
        150,
        warnings,
        intermediates,
        equations
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.endpoint).toBe('/api/v1/operations/fill-drain-time');
      expect(transcript!.method).toBe('POST');
      expect(transcript!.normalizedInputs).toEqual({ test: 'data' });
      expect(transcript!.selectedEquations).toEqual(['equation1', 'equation2']);
      expect(transcript!.intermediateValues).toEqual({ step1: 10, step2: 20 });
      expect(transcript!.warnings).toEqual(warnings);
      expect(transcript!.meta.processingTime).toBe(150);
      expect(transcript!.result).toEqual(response);
    });

    it('should not create transcript when header is absent', () => {
      const request = {
        url: '/api/v1/operations/fill-drain-time',
        method: 'POST',
        body: { test: 'data' },
        headers: {}
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).toBeNull();
    });

    it('should handle null/undefined inputs gracefully', () => {
      const request = {
        url: '/api/v1/test',
        method: 'POST',
        body: null,
        headers: { 'x-engivault-transcript': 'on' }
      } as any;

      const transcript = transcriptService.createFromRequest(
        request,
        { result: 'success' },
        100,
        [],
        {},
        []
      );

      expect(transcript).not.toBeNull();
      expect(transcript!.normalizedInputs).toBeNull();
      expect(transcript!.meta.units).toEqual({});
    });
  });
});
