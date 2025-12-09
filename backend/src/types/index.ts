// TypeScript Types for AI Control Room Backend
// These types match the Prisma schema and provide additional utility types

import {
  TenantPlan,
  UserRole,
  AgentStatus,
  RunStatus,
  RunTrigger,
  StepType,
  ToolCategory,
  ToolStatus,
  AuthType,
  DomainCategory,
  DomainPackStatus,
  AuditSeverity
} from '@prisma/client';

// Re-export Prisma enums for convenience
export {
  TenantPlan,
  UserRole,
  AgentStatus,
  RunStatus,
  RunTrigger,
  StepType,
  ToolCategory,
  ToolStatus,
  AuthType,
  DomainCategory,
  DomainPackStatus,
  AuditSeverity
};

// ============================================================================
// REQUEST CONTEXT
// ============================================================================

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: UserRole;
  permissions: string[];
}

export interface RequestContext extends TenantContext {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// CONFIGURATION TYPES (JSON Fields)
// ============================================================================

export interface AgentConfiguration {
  model: 'claude-3-sonnet' | 'claude-3-opus' | 'claude-3-haiku';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  memory: 'none' | 'short-term' | 'long-term';
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
}

export interface AgentSchedule {
  enabled: boolean;
  cron: string | null;
  timezone: string;
}

export interface AgentMetrics {
  totalRuns: number;
  successRate: number;
  avgExecutionTime: number;
  lastRunAt: string | null;
  tokensUsed: number;
  costTotal: number;
}

export interface HRConfig {
  candidateSourcing?: boolean;
  resumeScreening?: boolean;
  employeeOnboarding?: boolean;
  policyQA?: boolean;
  integrations?: string[];
}

export interface TenantSettings {
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
}

export interface TenantLimits {
  maxAgents: number;
  maxUsers: number;
  maxExecutionsPerMonth: number;
  storageGB: number;
}

export interface RunMetrics {
  duration: number | null;
  tokensUsed: number;
  toolCalls: number;
  cost: number;
  retries: number;
}

export interface RunError {
  code: string;
  message: string;
  stack?: string;
  toolId?: string;
}

export interface ToolRateLimit {
  requests: number;
  window: number; // seconds
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AgentFilters extends PaginationParams {
  status?: AgentStatus;
  domainPackId?: string;
  search?: string;
}

export interface RunFilters extends PaginationParams {
  agentId?: string;
  status?: RunStatus;
  trigger?: RunTrigger;
  startDate?: string;
  endDate?: string;
}

export interface ToolFilters extends PaginationParams {
  category?: ToolCategory;
  status?: ToolStatus;
  search?: string;
}

export interface AuditLogFilters extends PaginationParams {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

export interface CreateAgentDTO {
  name: string;
  description?: string;
  avatar?: string;
  domainPackId?: string;
  configuration?: Partial<AgentConfiguration>;
  schedule?: Partial<AgentSchedule>;
  hrConfig?: HRConfig;
}

export interface UpdateAgentDTO {
  name?: string;
  description?: string;
  avatar?: string;
  status?: AgentStatus;
  domainPackId?: string;
  configuration?: Partial<AgentConfiguration>;
  schedule?: Partial<AgentSchedule>;
  hrConfig?: HRConfig;
}

export interface CreateRunDTO {
  agentId: string;
  trigger?: RunTrigger;
  input?: Record<string, unknown>;
}

export interface CreateTenantDTO {
  name: string;
  slug: string;
  logo?: string;
  plan?: TenantPlan;
  industry?: string;
  size?: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantDTO {
  name?: string;
  logo?: string;
  plan?: TenantPlan;
  settings?: Partial<TenantSettings>;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  name?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardMetrics {
  activeAgents: number;
  runsToday: number;
  successRate: number;
  avgExecutionTime: number;
  activeAgentsTrend: number;
  runsTodayTrend: number;
  successRateTrend: number;
  avgExecutionTimeTrend: number;
}

export interface ActivityItem {
  id: string;
  type: 'run_started' | 'run_completed' | 'run_failed' | 'agent_created' | 'tool_connected' | 'alert';
  message: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageStats {
  agentsCount: number;
  usersCount: number;
  executionsThisMonth: number;
  tokensUsedThisMonth: number;
  storageUsedGB: number;
}

// ============================================================================
// JWT TYPES
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
