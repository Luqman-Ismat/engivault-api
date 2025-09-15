import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import type { Task, Project, Sprint, CreateTaskRequest, UpdateTaskRequest, CreateProjectRequest, UpdateProjectRequest } from '@/types/project';

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  teamMembers: z.array(z.string()),
  totalSprints: z.number().int().min(1).max(50).optional().default(4)
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional(),
  endDate: z.string().datetime().optional(),
  teamMembers: z.array(z.string()).optional(),
  currentSprint: z.number().int().min(1).optional(),
  totalSprints: z.number().int().min(1).max(50).optional()
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  priority: z.enum(['low', 'medium', 'high']),
  assignee: z.string(),
  phase: z.enum(['requirements', 'design', 'implementation', 'testing', 'deployment']).optional(),
  sprint: z.number().int().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string()
});

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

const projectParamsSchema = z.object({
  id: z.string()
});

const taskParamsSchema = z.object({
  id: z.string()
});

export default async function projectsRoutes(fastify: FastifyInstance): Promise<void> {
  
  // GET /projects - Get all projects for user
  fastify.get('/projects', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get all projects for authenticated user',
      description: 'Retrieve all projects where the user is owner or team member',
      response: {
        200: {
          type: 'object',
          properties: {
            projects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'completed', 'on-hold', 'cancelled'] },
                  startDate: { type: 'string' },
                  endDate: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  ownerId: { type: 'string' },
                  teamMembers: { type: 'array', items: { type: 'string' } },
                  currentSprint: { type: 'number' },
                  totalSprints: { type: 'number' }
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
      
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return reply.send({ projects });
      
    } catch (error) {
      fastify.log.error('Error fetching projects:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch projects'
      });
    }
  });

  // POST /projects - Create new project
  fastify.post('/projects', {
    schema: {
      tags: ['Project Management'],
      summary: 'Create a new project',
      description: 'Create a new project with the authenticated user as owner',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          teamMembers: { type: 'array', items: { type: 'string' } },
          totalSprints: { type: 'number', minimum: 1, maximum: 50, default: 4 }
        },
        required: ['name', 'description', 'startDate', 'teamMembers']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            project: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                ownerId: { type: 'string' },
                teamMembers: { type: 'array', items: { type: 'string' } },
                currentSprint: { type: 'number' },
                totalSprints: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const data = createProjectSchema.parse(request.body);
      
      // Check if user has Pro or Enterprise plan
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user || !['pro', 'enterprise'].includes(user.subscriptionTier)) {
        return reply.status(403).send({
          error: 'Subscription required',
          message: 'Project management features require Pro or Enterprise subscription'
        });
      }
      
      const project = await prisma.project.create({
        data: {
          ...data,
          ownerId: userId,
          teamMembers: [...data.teamMembers, userId], // Add owner to team members
          currentSprint: 1
        }
      });
      
      return reply.status(201).send({ project });
      
    } catch (error) {
      fastify.log.error('Error creating project:', error as Error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create project'
      });
    }
  });

  // GET /projects/:id - Get specific project
  fastify.get('/projects/:id', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get specific project details',
      description: 'Retrieve detailed information about a specific project',
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
            project: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                ownerId: { type: 'string' },
                teamMembers: { type: 'array', items: { type: 'string' } },
                currentSprint: { type: 'number' },
                totalSprints: { type: 'number' }
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
      const params = projectParamsSchema.parse(request.params);
      
      const project = await prisma.project.findFirst({
        where: {
          id: params.id,
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        }
      });
      
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
          message: 'Project not found or access denied'
        });
      }
      
      return reply.send({ project });
      
    } catch (error) {
      fastify.log.error('Error fetching project:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch project'
      });
    }
  });

  // GET /projects/:id/tasks - Get all tasks for a project
  fastify.get('/projects/:id/tasks', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get all tasks for a project',
      description: 'Retrieve all tasks belonging to a specific project',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
          phase: { type: 'string', enum: ['requirements', 'design', 'implementation', 'testing', 'deployment'] },
          sprint: { type: 'number' },
          assignee: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
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
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = projectParamsSchema.parse(request.params);
      const query = request.query as any;
      
      // Verify user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: params.id,
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        }
      });
      
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
          message: 'Project not found or access denied'
        });
      }
      
      const whereClause: any = { projectId: params.id };
      
      // Apply filters
      if (query.status) whereClause.status = query.status;
      if (query.phase) whereClause.phase = query.phase;
      if (query.sprint) whereClause.sprint = query.sprint;
      if (query.assignee) whereClause.assignee = query.assignee;
      if (query.priority) whereClause.priority = query.priority;
      
      const tasks = await prisma.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
      
      return reply.send({ tasks });
      
    } catch (error) {
      fastify.log.error('Error fetching tasks:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch tasks'
      });
    }
  });

  // POST /projects/:id/tasks - Create new task
  fastify.post('/projects/:id/tasks', {
    schema: {
      tags: ['Project Management'],
      summary: 'Create a new task in project',
      description: 'Create a new task within a specific project',
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
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          assignee: { type: 'string' },
          phase: { type: 'string', enum: ['requirements', 'design', 'implementation', 'testing', 'deployment'] },
          sprint: { type: 'number' },
          dueDate: { type: 'string', format: 'date-time' },
          estimatedHours: { type: 'number', minimum: 0, maximum: 1000 },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'description', 'priority', 'assignee']
      },
      response: {
        201: {
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
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = projectParamsSchema.parse(request.params);
      const data = createTaskSchema.parse({ ...request.body, projectId: params.id });
      
      // Verify user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: params.id,
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        }
      });
      
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
          message: 'Project not found or access denied'
        });
      }
      
      const task = await prisma.task.create({
        data: {
          ...data,
          status: 'todo'
        }
      });
      
      return reply.status(201).send({ task });
      
    } catch (error) {
      fastify.log.error('Error creating task:', error as Error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors
        });
      }
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create task'
      });
    }
  });

  // GET /projects/:id/metrics - Get project metrics and user calculation tracking
  fastify.get('/projects/:id/metrics', {
    schema: {
      tags: ['Project Management'],
      summary: 'Get project metrics and user calculation tracking',
      description: 'Retrieve comprehensive metrics for project including per-user calculation usage (Pro/Enterprise only)',
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
            projectMetrics: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                totalTasks: { type: 'number' },
                completedTasks: { type: 'number' },
                inProgressTasks: { type: 'number' },
                todoTasks: { type: 'number' },
                totalCalculations: { type: 'number' },
                calculationsByUser: { type: 'object' },
                calculationsByType: { type: 'object' },
                averageExecutionTime: { type: 'number' },
                lastActivity: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const params = projectParamsSchema.parse(request.params);
      
      // Verify user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: params.id,
          OR: [
            { ownerId: userId },
            { teamMembers: { has: userId } }
          ]
        }
      });
      
      if (!project) {
        return reply.status(404).send({
          error: 'Project not found',
          message: 'Project not found or access denied'
        });
      }
      
      // Get task metrics
      const [totalTasks, completedTasks, inProgressTasks, todoTasks] = await Promise.all([
        prisma.task.count({ where: { projectId: params.id } }),
        prisma.task.count({ where: { projectId: params.id, status: 'done' } }),
        prisma.task.count({ where: { projectId: params.id, status: 'in-progress' } }),
        prisma.task.count({ where: { projectId: params.id, status: 'todo' } })
      ]);
      
      // Get calculation metrics (Pro/Enterprise feature)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      let calculationMetrics = {
        totalCalculations: 0,
        calculationsByUser: {},
        calculationsByType: {},
        averageExecutionTime: 0,
        lastActivity: new Date().toISOString()
      };
      
      if (user && ['pro', 'enterprise'].includes(user.subscriptionTier)) {
        const calculations = await prisma.userCalculation.findMany({
          where: { projectId: params.id }
        });
        
        const calculationsByUser = calculations.reduce((acc, calc) => {
          acc[calc.userId] = (acc[calc.userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const calculationsByType = calculations.reduce((acc, calc) => {
          acc[calc.calculationType] = (acc[calc.calculationType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const averageExecutionTime = calculations.length > 0 
          ? calculations.reduce((sum, calc) => sum + calc.executionTime, 0) / calculations.length 
          : 0;
        
        const lastActivity = calculations.length > 0 
          ? calculations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
          : new Date().toISOString();
        
        calculationMetrics = {
          totalCalculations: calculations.length,
          calculationsByUser,
          calculationsByType,
          averageExecutionTime,
          lastActivity
        };
      }
      
      const projectMetrics = {
        projectId: params.id,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        ...calculationMetrics
      };
      
      return reply.send({ projectMetrics });
      
    } catch (error) {
      fastify.log.error('Error fetching project metrics:', error as Error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch project metrics'
      });
    }
  });
}
