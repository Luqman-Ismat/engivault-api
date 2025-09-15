import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { config } from '@/config/environment';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const createApiKeySchema = z.object({
  keyName: z.string().min(1, 'Key name is required'),
  expiresAt: z.string().datetime().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default async function authRoutes(fastify: FastifyInstance) {
  // User registration
  fastify.post('/auth/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account and generate a default API key',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          companyName: { type: 'string' }
        },
        required: ['email', 'password']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            apiKey: { type: 'string' },
            userId: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, companyName } = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          companyName,
          subscriptionTier: 'free'
        }
      });

      // Create default API key
      const apiKey = crypto.randomBytes(config.API_KEY_LENGTH).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      await prisma.apiKey.create({
        data: {
          userId: user.id,
          keyName: 'Default API Key',
          apiKey,
          keyHash,
          rateLimitPerMinute: 5,
          rateLimitPerDay: 10
        }
      });

      return reply.status(201).send({
        message: 'User registered successfully',
        apiKey,
        userId: user.id
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors
        });
      }

      fastify.log.error('Registration error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Registration failed'
      });
    }
  });

  // User login
  fastify.post('/auth/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'Login user',
      description: 'Authenticate user and return account information',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                companyName: { type: 'string' },
                subscriptionTier: { type: 'string' },
                subscriptionStatus: { type: 'string' }
              }
            },
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyName: { type: 'string' },
                  createdAt: { type: 'string' },
                  lastUsedAt: { type: 'string' },
                  usageCountTotal: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: { apiKeys: { where: { isActive: true } } }
      });

      if (!user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Return user info and API keys (without the actual keys)
      const apiKeys = user.apiKeys.map(key => ({
        id: key.id,
        keyName: key.keyName,
        createdAt: key.createdAt.toISOString(),
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        usageCountTotal: Number(key.usageCountTotal)
      }));

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          companyName: user.companyName,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus
        },
        apiKeys
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors
        });
      }

      fastify.log.error('Login error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Login failed'
      });
    }
  });

  // Create new API key
  fastify.post('/auth/api-keys', {
    schema: {
      tags: ['Authentication'],
      summary: 'Create a new API key',
      description: 'Generate a new API key for the authenticated user',
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          keyName: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' }
        },
        required: ['keyName']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            apiKey: { type: 'string' },
            keyInfo: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                keyName: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { keyName, expiresAt } = createApiKeySchema.parse(request.body);
      
      const apiKey = crypto.randomBytes(config.API_KEY_LENGTH).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Determine rate limits based on subscription tier
      const rateLimits = {
        free: { perMinute: 5, perDay: 10 },
        basic: { perMinute: 10, perDay: 50 },
        pro: { perMinute: 50, perDay: 500 },
        enterprise: { perMinute: 200, perDay: 5000 }
      };

      const limits = rateLimits[request.user.subscriptionTier as keyof typeof rateLimits] || rateLimits.free;

      const newApiKey = await prisma.apiKey.create({
        data: {
          userId: request.user.id,
          keyName,
          apiKey,
          keyHash,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          rateLimitPerMinute: limits.perMinute,
          rateLimitPerDay: limits.perDay
        }
      });

      return reply.status(201).send({
        message: 'API key created successfully',
        apiKey,
        keyInfo: {
          id: newApiKey.id,
          keyName: newApiKey.keyName,
          expiresAt: newApiKey.expiresAt?.toISOString() || null
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors
        });
      }

      fastify.log.error('API key creation error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'API key creation failed'
      });
    }
  });

  // List user's API keys
  fastify.get('/auth/api-keys', {
    schema: {
      tags: ['Authentication'],
      summary: 'List user API keys',
      description: 'Get all API keys for the authenticated user',
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyName: { type: 'string' },
                  createdAt: { type: 'string' },
                  lastUsedAt: { type: 'string' },
                  expiresAt: { type: 'string' },
                  isActive: { type: 'boolean' },
                  usageCountTotal: { type: 'number' },
                  usageCountToday: { type: 'number' },
                  rateLimitPerMinute: { type: 'number' },
                  rateLimitPerDay: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId: request.user.id },
        select: {
          id: true,
          keyName: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
          isActive: true,
          usageCountTotal: true,
          usageCountToday: true,
          rateLimitPerMinute: true,
          rateLimitPerDay: true
        }
      });

      const formattedApiKeys = apiKeys.map(key => ({
        ...key,
        createdAt: key.createdAt.toISOString(),
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        expiresAt: key.expiresAt?.toISOString() || null,
        usageCountTotal: Number(key.usageCountTotal)
      }));

      return reply.send({ apiKeys: formattedApiKeys });

    } catch (error) {
      fastify.log.error('API keys list error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve API keys'
      });
    }
  });

  // Revoke API key
  fastify.delete('/auth/api-keys/:keyId', {
    schema: {
      tags: ['Authentication'],
      summary: 'Revoke an API key',
      description: 'Deactivate an API key for the authenticated user',
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string' }
        },
        required: ['keyId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { keyId } = request.params;

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          userId: request.user.id
        }
      });

      if (!apiKey) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'API key not found'
        });
      }

      await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false }
      });

      return reply.send({
        message: 'API key revoked successfully'
      });

    } catch (error) {
      fastify.log.error('API key revocation error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to revoke API key'
      });
    }
  });

  // Get user profile
  fastify.get('/auth/profile', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      description: 'Get the authenticated user profile information',
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                companyName: { type: 'string' },
                subscriptionTier: { type: 'string' },
                subscriptionStatus: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          companyName: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      return reply.send({
        user: {
          ...user,
          createdAt: user.createdAt.toISOString()
        }
      });

    } catch (error) {
      fastify.log.error('Profile retrieval error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve profile'
      });
    }
  });
}
