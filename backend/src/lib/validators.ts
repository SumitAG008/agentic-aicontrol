// Zod Validation Schemas for AI Control Room
// These schemas validate incoming API requests

import { z } from 'zod';

// ============================================================================
// ENUMS (matching Prisma)
// ============================================================================

export const TenantPlanSchema = z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']);
export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']);
export const AgentStatusSchema = z.enum(['IDLE', 'RUNNING', 'PAUSED', 'ERROR', 'TERMINATED', 'CONFIGURING']);
export const RunStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT']);
export const RunTriggerSchema = z.enum(['MANUAL', 'SCHEDULED', 'WEBHOOK', 'EVENT', 'API']);
export const ToolCategorySchema = z.enum(['COMMUNICATION', 'DATA', 'ANALYTICS', 'INTEGRATION', 'HRTECH', 'PRODUCTIVITY', 'AI', 'CUSTOM']);
export const ToolStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DEPRECATED', 'BETA']);
export const AuthTypeSchema = z.enum(['NONE', 'API_KEY', 'OAUTH2', 'BASIC', 'BEARER', 'CUSTOM']);
export const DomainCategorySchema = z.enum(['HR_CRM', 'HEALTHCARE', 'LIFE_SCIENCES', 'FINANCE', 'LEGAL', 'MARKETING', 'OPERATIONS', 'CUSTOM']);
export const AuditSeveritySchema = z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']);

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const AgentConfigurationSchema = z.object({
  model: z.enum(['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku']).default('claude-3-sonnet'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(100000).default(4096),
  systemPrompt: z.string().default(''),
  tools: z.array(z.string()).default([]),
  memory: z.enum(['none', 'short-term', 'long-term']).default('none'),
  autonomyLevel: z.enum(['supervised', 'semi-autonomous', 'autonomous']).default('supervised'),
}).partial();

export const AgentScheduleSchema = z.object({
  enabled: z.boolean().default(false),
  cron: z.string().nullable().default(null),
  timezone: z.string().default('UTC'),
}).partial();

export const HRConfigSchema = z.object({
  candidateSourcing: z.boolean().optional(),
  resumeScreening: z.boolean().optional(),
  employeeOnboarding: z.boolean().optional(),
  policyQA: z.boolean().optional(),
  integrations: z.array(z.string()).optional(),
}).optional();

export const TenantSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  notifications: z.object({
    email: z.boolean().default(true),
    slack: z.boolean().default(false),
    inApp: z.boolean().default(true),
  }).default({}),
}).partial();

// ============================================================================
// AGENT SCHEMAS
// ============================================================================

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  domainPackId: z.string().cuid().optional(),
  configuration: AgentConfigurationSchema.optional(),
  schedule: AgentScheduleSchema.optional(),
  hrConfig: HRConfigSchema,
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  status: AgentStatusSchema.optional(),
  domainPackId: z.string().cuid().nullable().optional(),
  configuration: AgentConfigurationSchema.optional(),
  schedule: AgentScheduleSchema.optional(),
  hrConfig: HRConfigSchema,
});

export const AgentFiltersSchema = z.object({
  status: AgentStatusSchema.optional(),
  domainPackId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// RUN SCHEMAS
// ============================================================================

export const CreateRunSchema = z.object({
  agentId: z.string().cuid(),
  trigger: RunTriggerSchema.default('MANUAL'),
  input: z.record(z.unknown()).default({}),
});

export const RunFiltersSchema = z.object({
  agentId: z.string().optional(),
  status: RunStatusSchema.optional(),
  trigger: RunTriggerSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const ToolFiltersSchema = z.object({
  category: ToolCategorySchema.optional(),
  status: ToolStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const UpdateToolConfigSchema = z.object({
  credentials: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

// ============================================================================
// TENANT SCHEMAS
// ============================================================================

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional(),
  plan: TenantPlanSchema.default('STARTER'),
  industry: z.string().optional(),
  size: z.string().optional(),
  settings: TenantSettingsSchema.optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo: z.string().url().optional(),
  plan: TenantPlanSchema.optional(),
  settings: TenantSettingsSchema.optional(),
});

// ============================================================================
// USER/AUTH SCHEMAS
// ============================================================================

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  role: UserRoleSchema.default('VIEWER'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  tenantName: z.string().min(1).max(100),
  tenantSlug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

export const AuditLogFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  severity: AuditSeveritySchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const IdParamSchema = z.object({
  id: z.string().cuid(),
});

export const SlugParamSchema = z.object({
  slug: z.string().min(1),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
export type AgentFiltersInput = z.infer<typeof AgentFiltersSchema>;
export type CreateRunInput = z.infer<typeof CreateRunSchema>;
export type RunFiltersInput = z.infer<typeof RunFiltersSchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
