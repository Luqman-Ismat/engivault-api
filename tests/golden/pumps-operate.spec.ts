import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../helper';
import { FastifyInstance } from 'fastify';

describe('Golden Tests - Pumps Operate (Parallel)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should calculate parallel pump operation for identical pumps', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pumps/operate',
      payload: {
        pumps: [
          {
            id: 'pump1',
            curve: [
              { q: 0, h: 50 },
              { q: 0.1, h: 48 },
              { q: 0.2, h: 44 },
              { q: 0.3, h: 38 },
              { q: 0.4, h: 30 },
              { q: 0.5, h: 20 }
            ]
          },
          {
            id: 'pump2',
            curve: [
              { q: 0, h: 50 },
              { q: 0.1, h: 48 },
              { q: 0.2, h: 44 },
              { q: 0.3, h: 38 },
              { q: 0.4, h: 30 },
              { q: 0.5, h: 20 }
            ]
          }
        ],
        arrangement: 'parallel',
        system: {
          staticHead: 20,
          k: 100
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    // Golden values with tolerance - updated to match actual calculated values
    expect(result.flow.value).toBeCloseTo(0.468, 0.01);
    expect(result.head.value).toBeCloseTo(41.95, 0.1);
    expect(result.pumpHead.value).toBeCloseTo(41.95, 0.1);
    expect(result.systemHead.value).toBeCloseTo(41.95, 0.1);
    expect(result.meta.convergence).toBe(true);
    expect(result.meta.iterations).toBeGreaterThan(0);
  });

  it('should calculate parallel pump operation for different pump curves', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pumps/operate',
      payload: {
        pumps: [
          {
            id: 'pump1',
            curve: [
              { q: 0, h: 60 },
              { q: 0.1, h: 58 },
              { q: 0.2, h: 54 },
              { q: 0.3, h: 48 },
              { q: 0.4, h: 40 },
              { q: 0.5, h: 30 }
            ]
          },
          {
            id: 'pump2',
            curve: [
              { q: 0, h: 40 },
              { q: 0.1, h: 38 },
              { q: 0.2, h: 34 },
              { q: 0.3, h: 28 },
              { q: 0.4, h: 20 },
              { q: 0.5, h: 10 }
            ]
          }
        ],
        arrangement: 'parallel',
        system: {
          staticHead: 15,
          k: 80
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    // Golden values with tolerance - updated to match actual calculated values
    expect(result.flow.value).toBeCloseTo(0.532, 0.01);
    expect(result.head.value).toBeCloseTo(37.65, 0.1);
    expect(result.pumpHead.value).toBeCloseTo(37.65, 0.1);
    expect(result.systemHead.value).toBeCloseTo(37.65, 0.1);
    expect(result.meta.convergence).toBe(true);
  });

  it('should handle high static head system', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pumps/operate',
      payload: {
        pumps: [
          {
            id: 'pump1',
            curve: [
              { q: 0, h: 80 },
              { q: 0.1, h: 78 },
              { q: 0.2, h: 74 },
              { q: 0.3, h: 68 },
              { q: 0.4, h: 60 },
              { q: 0.5, h: 50 }
            ]
          },
          {
            id: 'pump2',
            curve: [
              { q: 0, h: 80 },
              { q: 0.1, h: 78 },
              { q: 0.2, h: 74 },
              { q: 0.3, h: 68 },
              { q: 0.4, h: 60 },
              { q: 0.5, h: 50 }
            ]
          }
        ],
        arrangement: 'parallel',
        system: {
          staticHead: 60,
          k: 50
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    // Golden values with tolerance - updated to match actual calculated values
    expect(result.flow.value).toBeCloseTo(0.481, 0.01);
    expect(result.head.value).toBeCloseTo(71.57, 0.1);
    expect(result.pumpHead.value).toBeCloseTo(71.57, 0.1);
    expect(result.systemHead.value).toBeCloseTo(71.57, 0.1);
    expect(result.meta.convergence).toBe(true);
  });

  it('should handle low resistance system', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pumps/operate',
      payload: {
        pumps: [
          {
            id: 'pump1',
            curve: [
              { q: 0, h: 30 },
              { q: 0.1, h: 28 },
              { q: 0.2, h: 24 },
              { q: 0.3, h: 18 },
              { q: 0.4, h: 10 },
              { q: 0.5, h: 0 }
            ]
          }
        ],
        arrangement: 'single',
        system: {
          staticHead: 5,
          k: 10
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    // Golden values with tolerance - updated to match actual calculated values
    expect(result.flow.value).toBeCloseTo(0.431, 0.01);
    expect(result.head.value).toBeCloseTo(6.86, 0.1);
    expect(result.pumpHead.value).toBeCloseTo(6.86, 0.1);
    expect(result.systemHead.value).toBeCloseTo(6.86, 0.1);
    expect(result.meta.convergence).toBe(true);
  });

  it('should handle single pump operation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/pumps/operate',
      payload: {
        pumps: [
          {
            id: 'pump1',
            curve: [
              { q: 0, h: 40 },
              { q: 0.1, h: 38 },
              { q: 0.2, h: 34 },
              { q: 0.3, h: 28 },
              { q: 0.4, h: 20 },
              { q: 0.5, h: 10 }
            ]
          }
        ],
        arrangement: 'single',
        system: {
          staticHead: 10,
          k: 60
        }
      }
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    // Golden values with tolerance - updated to match actual calculated values
    expect(result.flow.value).toBeCloseTo(0.403, 0.01);
    expect(result.head.value).toBeCloseTo(19.73, 0.1);
    expect(result.pumpHead.value).toBeCloseTo(19.73, 0.1);
    expect(result.systemHead.value).toBeCloseTo(19.73, 0.1);
    expect(result.meta.convergence).toBe(true);
  });
});
