import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { hashPassword, verifyPassword, generateApiKey, hashApiKey, generateUserId } from '@/utils/auth';
import { UserRegistrationSchema, UserLoginSchema, ApiKeyCreateSchema } from '@/types';
import { createSuccessResponse, AppError, handleAsync } from '@/utils/errorHandler';
import logger from '@/utils/logger';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // User Registration
  fastify.post('/auth/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          companyName: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    companyName: { type: 'string' },
                    subscriptionTier: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
                token: { type: 'string' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const body = UserRegistrationSchema.parse(request.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        id: generateUserId(),
        email: body.email,
        passwordHash,
        companyName: body.companyName || null,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
      },
    });
    
    // Generate JWT token
    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    );
    
    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');
    
    const response = createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
    
    return reply.status(201).send(response);
  }));

  // User Login
  fastify.post('/auth/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'Login user',
      description: 'Authenticate user and return JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    companyName: { type: 'string' },
                    subscriptionTier: { type: 'string' },
                  },
                },
                token: { type: 'string' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const body = UserLoginSchema.parse(request.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Generate JWT token
    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    );
    
    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');
    
    const response = createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
      },
      token,
    });
    
    return reply.send(response);
  }));

  // Create API Key
  fastify.post('/auth/api-keys', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: 'Create API key',
      description: 'Generate a new API key for the authenticated user',
      body: {
        type: 'object',
        required: ['keyName'],
        properties: {
          keyName: { type: 'string', minLength: 1 },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                apiKey: { type: 'string' },
                keyName: { type: 'string' },
                expiresAt: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const body = ApiKeyCreateSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    
    // Create API key record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId,
        keyName: body.keyName,
        apiKey,
        keyHash,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        rateLimitPerMinute: 100,
        rateLimitPerDay: 10000,
      },
    });
    
    logger.info({ userId, apiKeyId: apiKeyRecord.id, keyName: body.keyName }, 'API key created successfully');
    
    const response = createSuccessResponse({
      apiKey,
      keyName: apiKeyRecord.keyName,
      expiresAt: apiKeyRecord.expiresAt?.toISOString() || null,
      createdAt: apiKeyRecord.createdAt.toISOString(),
    });
    
    return reply.status(201).send(response);
  }));

  // List API Keys
  fastify.get('/auth/api-keys', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: 'List API keys',
      description: 'Get all API keys for the authenticated user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyName: { type: 'string' },
                  usageCountToday: { type: 'number' },
                  usageCountTotal: { type: 'string' },
                  lastUsedAt: { type: 'string' },
                  expiresAt: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string' },
                },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        keyName: true,
        usageCountToday: true,
        usageCountTotal: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const response = createSuccessResponse(apiKeys);
    return reply.send(response);
  }));

  // Revoke API Key
  fastify.delete('/auth/api-keys/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: 'Revoke API key',
      description: 'Deactivate an API key',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as any).userId;
    
    // Find and update API key
    const apiKey = await prisma.apiKey.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isActive: false,
      },
    });
    
    if (apiKey.count === 0) {
      throw new AppError('API key not found', 404);
    }
    
    logger.info({ userId, apiKeyId: id }, 'API key revoked successfully');
    
    const response = createSuccessResponse({ message: 'API key revoked successfully' });
    return reply.send(response);
  }));
}