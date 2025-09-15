import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import type { Task, UpdateTaskRequest } from '@/types/project';

// Validation schemas
const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().optional(),
  phase: z.enum(['requirements', 'design', 'implementation', 'testing', 'deployment']).optional(),
  sprint: z.number().int().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  actualHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional()
});

const taskParamsSchema = z.object({
  id: z.string()
});

const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string()),
  updates: z.object({
    status: z.enum(['todo', 'in-progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignee: z.string().optional(),
    sprint: z.number().int().min(1).optional()
  })
});

export default async function tasksRoutes(fastify: FastifyInstance): Promise<void> {
  
  // GET /tasks - Get all tasks for user (across all projects)
  fastify.get('/tasks', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get all tasks for authenticated user',
      description: 'Retrieve all tasks across all projects where the user is involved',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          assignee: { type: 'string' },
          projectId: { type: 'string' },
          phase: { type: 'string', enum: ['requirements', 'design', 'implementation', 'testing', 'deployment'] },
          sprint: { type: 'number' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  assignee: { type: 'string' },
                  phase: { type: 'string' },
                  sprint: { type: 'number' },
                  dueDate: { type: 'string' },
                  estimatedHours: { type: 'number' },
                  actualHours: { type: 'number' },
                  tags: { type: 'array', items: { type: 'string' } },
                  projectId: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            total: { type: 'number' },
            hasMore: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const query = request.query as any;
      
      // Get all projects user has access to
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        },
        select: { id: true }
      });
      
      const projectIds = userProjects.map(p => p.id);
      
      if (projectIds.length === 0) {
        return reply.send({ tasks: [], total: 0, hasMore: false });
      }
      
      const whereClause: any = { projectId: { in: projectIds } };
      
      // Apply filters
      if (query.status) whereClause.status = query.status;
      if (query.priority) whereClause.priority = query.priority;
      if (query.assignee) whereClause.assignee = query.assignee;
      if (query.projectId) whereClause.projectId = query.projectId;
      if (query.phase) whereClause.phase = query.phase;
      if (query.sprint) whereClause.sprint = query.sprint;
      
      const limit = Math.min(query.limit || 50, 100);
      const offset = query.offset || 0;
      
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.task.count({ where: whereClause })
      ]);
      
      return reply.send({
        tasks,
        total,
        hasMore: offset + limit < total
      });
      
    } catch (error) {
      fastify.log.error('Error fetching tasks:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch tasks'
      });
    }
  });

  // GET /tasks/:id - Get specific task
  fastify.get('/tasks/:id', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get specific task details',
      description: 'Retrieve detailed information about a specific task',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            task: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                assignee: { type: 'string' },
                phase: { type: 'string' },
                sprint: { type: 'number' },
                dueDate: { type: 'string' },
                estimatedHours: { type: 'number' },
                actualHours: { type: 'number' },
                tags: { type: 'array', items: { type: 'string' } },
                projectId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = taskParamsSchema.parse(request.params);
      
      // Get task and verify user has access to the project
      const task = await prisma.task.findFirst({
        where: {
          id: params.id,
          project: {
            OR: [
              { ownerId: userId },
              { teamMembers: { has: userId } }
            ]
          }
        }
      });
      
      if (!task) {
        return reply.status(404).send({
          error: 'Task not found',
          message: 'Task not found or access denied'
        });
      }
      
      return reply.send({ task });
      
    } catch (error) {
      fastify.log.error('Error fetching task:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch task'
      });
    }
  });

  // PUT /tasks/:id - Update specific task
  fastify.put('/tasks/:id', {
    schema: {
      tags: ['Project Management'],
      summary: 'Update specific task',
      description: 'Update a specific task with new information',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          assignee: { type: 'string' },
          phase: { type: 'string', enum: ['requirements', 'design', 'implementation', 'testing', 'deployment'] },
          sprint: { type: 'number' },
          dueDate: { type: 'string', format: 'date-time' },
          estimatedHours: { type: 'number', minimum: 0, maximum: 1000 },
          actualHours: { type: 'number', minimum: 0, maximum: 1000 },
          tags: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            task: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                assignee: { type: 'string' },
                phase: { type: 'string' },
                sprint: { type: 'number' },
                dueDate: { type: 'string' },
                estimatedHours: { type: 'number' },
                actualHours: { type: 'number' },
                tags: { type: 'array', items: { type: 'string' } },
                projectId: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = taskParamsSchema.parse(request.params);
      const data = updateTaskSchema.parse(request.body);
      
      // Verify user has access to the task's project
      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.id,
          project: {
            OR: [
              { ownerId: userId },
              { teamMembers: { has: userId } }
            ]
          }
        }
      });
      
      if (!existingTask) {
        return reply.status(404).send({
          error: 'Task not found',
          message: 'Task not found or access denied'
        });
      }
      
      const updatedTask = await prisma.task.update({
        where: { id: params.id },
        data: {
          ...data,
          updatedAt: new Date().toISOString()
        }
      });
      
      return reply.send({ task: updatedTask });
      
    } catch (error) {
      fastify.log.error('Error updating task:', error as Error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to update task'
      });
    }
  });

  // DELETE /tasks/:id - Delete specific task
  fastify.delete('/tasks/:id', {
    schema: {
      tags: ['Project Management'],
      summary: 'Delete specific task',
      description: 'Delete a specific task (only project owners can delete tasks)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        204: { type: 'null' },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = taskParamsSchema.parse(request.params);
      
      // Verify user is the project owner
      const task = await prisma.task.findFirst({
        where: {
          id: params.id,
          project: { ownerId: userId }
        }
      });
      
      if (!task) {
        return reply.status(404).send({
          error: 'Task not found',
          message: 'Task not found or access denied'
        });
      }
      
      await prisma.task.delete({
        where: { id: params.id }
      });
      
      return reply.status(204).send();
      
    } catch (error) {
      fastify.log.error('Error deleting task:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to delete task'
      });
    }
  });

  // PUT /tasks/bulk-update - Bulk update multiple tasks
  fastify.put('/tasks/bulk-update', {
    schema: {
      tags: ['Project Management'],
      summary: 'Bulk update multiple tasks',
      description: 'Update multiple tasks at once (Pro/Enterprise feature)',
      body: {
        type: 'object',
        properties: {
          taskIds: { type: 'array', items: { type: 'string' } },
          updates: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              assignee: { type: 'string' },
              sprint: { type: 'number' }
            }
          }
        },
        required: ['taskIds', 'updates']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            updatedTasks: { type: 'number' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  assignee: { type: 'string' },
                  sprint: { type: 'number' },
                  updatedAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const data = bulkUpdateSchema.parse(request.body);
      
      // Check if user has Pro or Enterprise plan
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user || !['pro', 'enterprise'].includes(user.subscriptionTier)) {
        return reply.status(403).send({
          error: 'Subscription required',
          message: 'Bulk operations require Pro or Enterprise subscription'
        });
      }
      
      // Verify user has access to all tasks
      const tasks = await prisma.task.findMany({
        where: {
          id: { in: data.taskIds },
          project: {
            OR: [
              { ownerId: userId },
              { teamMembers: { has: userId } }
            ]
          }
        }
      });
      
      if (tasks.length !== data.taskIds.length) {
        return reply.status(400).send({
          error: 'Access denied',
          message: 'Some tasks not found or access denied'
        });
      }
      
      // Update all tasks
      const updateResult = await prisma.task.updateMany({
        where: { id: { in: data.taskIds } },
        data: {
          ...data.updates,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Fetch updated tasks
      const updatedTasks = await prisma.task.findMany({
        where: { id: { in: data.taskIds } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignee: true,
          sprint: true,
          updatedAt: true
        }
      });
      
      return reply.send({
        updatedTasks: updateResult.count,
        tasks: updatedTasks
      });
      
    } catch (error) {
      fastify.log.error('Error bulk updating tasks:', error as Error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to bulk update tasks'
      });
    }
  });
}
