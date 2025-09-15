import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '@/utils/database';

export interface CalculationTrackingOptions {
  calculationType: string;
  endpoint: string;
  projectId?: string;
  taskId?: string;
}

export async function trackUserCalculation(
  request: FastifyRequest,
  reply: FastifyReply,
  options: CalculationTrackingOptions
): Promise<void> {
  try {
    const userId = request.user.id;
    const startTime = Date.now();
    
    // Get the response data after the calculation is complete
    const originalSend = reply.send.bind(reply);
    
    reply.send = function(payload: any) {
      const executionTime = Date.now() - startTime;
      
      // Only track for Pro and Enterprise users
      if (request.user.subscriptionTier === 'pro' || request.user.subscriptionTier === 'enterprise') {
        // Store calculation tracking data asynchronously
        storeCalculationData({
          userId,
          calculationType: options.calculationType,
          endpoint: options.endpoint,
          requestData: request.body || {},
          responseData: payload,
          executionTime,
          projectId: options.projectId,
          taskId: options.taskId
        }).catch(error => {
          // Log error but don't fail the request
          console.error('Failed to store calculation tracking data:', error);
        });
      }
      
      return originalSend(payload);
    };
    
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to track user calculation:', error);
  }
}

async function storeCalculationData(data: {
  userId: string;
  calculationType: string;
  endpoint: string;
  requestData: any;
  responseData: any;
  executionTime: number;
  projectId?: string;
  taskId?: string;
}): Promise<void> {
  try {
    await prisma.userCalculation.create({
      data: {
        userId: data.userId,
        calculationType: data.calculationType,
        endpoint: data.endpoint,
        requestData: data.requestData,
        responseData: data.responseData,
        executionTime: data.executionTime,
        projectId: data.projectId,
        taskId: data.taskId
      }
    });
  } catch (error) {
    console.error('Error storing calculation data:', error);
  }
}

// Middleware factory for different calculation types
export function createCalculationTracker(calculationType: string, endpoint: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = request.headers['x-project-id'] as string;
    const taskId = request.headers['x-task-id'] as string;
    
    await trackUserCalculation(request, reply, {
      calculationType,
      endpoint,
      projectId,
      taskId
    });
  };
}

// Helper function to get user calculation statistics
export async function getUserCalculationStats(userId: string, projectId?: string) {
  const whereClause: any = { userId };
  if (projectId) {
    whereClause.projectId = projectId;
  }
  
  const [totalCalculations, calculationsByType, averageExecutionTime] = await Promise.all([
    prisma.userCalculation.count({ where: whereClause }),
    prisma.userCalculation.groupBy({
      by: ['calculationType'],
      where: whereClause,
      _count: { calculationType: true }
    }),
    prisma.userCalculation.aggregate({
      where: whereClause,
      _avg: { executionTime: true }
    })
  ]);
  
  const calculationsByTypeMap = calculationsByType.reduce((acc, item) => {
    acc[item.calculationType] = item._count.calculationType;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalCalculations,
    calculationsByType: calculationsByTypeMap,
    averageExecutionTime: averageExecutionTime._avg.executionTime || 0
  };
}
