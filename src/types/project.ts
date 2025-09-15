// Project Management Types for EngiVault API

export type TaskStatus = "todo" | "in-progress" | "done"
export type TaskPriority = "low" | "medium" | "high"
export type ProjectPhase = "requirements" | "design" | "implementation" | "testing" | "deployment"

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  phase?: ProjectPhase
  sprint?: number
  createdAt: string
  updatedAt: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
  projectId: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "cancelled"
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  teamMembers: string[]
  phases: ProjectPhase[]
  currentSprint?: number
  totalSprints?: number
}

export interface Sprint {
  id: string
  name: string
  projectId: string
  sprintNumber: number
  startDate: string
  endDate: string
  status: "planning" | "active" | "completed"
  goals: string[]
  velocity?: number
  capacity?: number
}

export interface UserCalculation {
  id: string
  userId: string
  calculationType: string
  endpoint: string
  requestData: any
  responseData: any
  executionTime: number
  timestamp: string
  projectId?: string
  taskId?: string
}

export interface ProjectMetrics {
  projectId: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  totalCalculations: number
  calculationsByUser: Record<string, number>
  calculationsByType: Record<string, number>
  averageExecutionTime: number
  lastActivity: string
}

// Request/Response schemas
export interface CreateTaskRequest {
  title: string
  description: string
  priority: TaskPriority
  assignee: string
  phase?: ProjectPhase
  sprint?: number
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
  projectId: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  phase?: ProjectPhase
  sprint?: number
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
}

export interface CreateProjectRequest {
  name: string
  description: string
  startDate: string
  endDate?: string
  teamMembers: string[]
  totalSprints?: number
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: "active" | "completed" | "on-hold" | "cancelled"
  endDate?: string
  teamMembers?: string[]
  currentSprint?: number
  totalSprints?: number
}
