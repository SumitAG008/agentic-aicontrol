// Agent Service - Database operations for agents
// All queries are automatically scoped by tenant

import prisma from '../lib/prisma';
import { AgentStatus, Prisma } from '@prisma/client';
import {
  CreateAgentInput,
  UpdateAgentInput,
  AgentFiltersInput,
} from '../lib/validators';
import { TenantContext, AgentConfiguration, AgentSchedule, AgentMetrics } from '../types';

// Default configuration for new agents
const DEFAULT_CONFIGURATION: AgentConfiguration = {
  model: 'claude-3-sonnet',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: '',
  tools: [],
  memory: 'none',
  autonomyLevel: 'supervised',
};

const DEFAULT_SCHEDULE: AgentSchedule = {
  enabled: false,
  cron: null,
  timezone: 'UTC',
};

const DEFAULT_METRICS: AgentMetrics = {
  totalRuns: 0,
  successRate: 0,
  avgExecutionTime: 0,
  lastRunAt: null,
  tokensUsed: 0,
  costTotal: 0,
};

export class AgentService {
  /**
   * List agents with filters and pagination
   */
  async list(ctx: TenantContext, filters: AgentFiltersInput) {
    const { status, domainPackId, search, page, pageSize, sortBy, sortOrder } = filters;

    const where: Prisma.AgentWhereInput = {
      tenantId: ctx.tenantId,
      ...(status && { status }),
      ...(domainPackId && { domainPackId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          domainPack: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          _count: {
            select: { runs: true },
          },
        },
        orderBy: sortBy
          ? { [sortBy]: sortOrder }
          : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.agent.count({ where }),
    ]);

    return {
      data: agents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single agent by ID
   */
  async getById(ctx: TenantContext, agentId: string) {
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
      include: {
        domainPack: true,
        toolBindings: {
          include: {
            tool: true,
          },
        },
        runs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            trigger: true,
            createdAt: true,
            metrics: true,
          },
        },
        _count: {
          select: { runs: true },
        },
      },
    });

    return agent;
  }

  /**
   * Create a new agent
   */
  async create(ctx: TenantContext, data: CreateAgentInput) {
    const configuration = {
      ...DEFAULT_CONFIGURATION,
      ...data.configuration,
    };

    const schedule = {
      ...DEFAULT_SCHEDULE,
      ...data.schedule,
    };

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        domainPackId: data.domainPackId,
        tenantId: ctx.tenantId,
        createdById: ctx.userId,
        status: 'IDLE',
        configuration: configuration as unknown as Prisma.JsonObject,
        schedule: schedule as unknown as Prisma.JsonObject,
        metrics: DEFAULT_METRICS as unknown as Prisma.JsonObject,
        hrConfig: data.hrConfig as unknown as Prisma.JsonObject || null,
      },
      include: {
        domainPack: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    return agent;
  }

  /**
   * Update an existing agent
   */
  async update(ctx: TenantContext, agentId: string, data: UpdateAgentInput) {
    // First verify the agent belongs to the tenant
    const existing = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    // Merge configurations if provided
    const updateData: Prisma.AgentUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.status && { status: data.status }),
      ...(data.domainPackId !== undefined && { domainPackId: data.domainPackId }),
    };

    if (data.configuration) {
      const currentConfig = existing.configuration as unknown as AgentConfiguration;
      updateData.configuration = {
        ...currentConfig,
        ...data.configuration,
      } as unknown as Prisma.JsonObject;
    }

    if (data.schedule) {
      const currentSchedule = existing.schedule as unknown as AgentSchedule;
      updateData.schedule = {
        ...currentSchedule,
        ...data.schedule,
      } as unknown as Prisma.JsonObject;
    }

    if (data.hrConfig) {
      updateData.hrConfig = data.hrConfig as unknown as Prisma.JsonObject;
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: updateData,
      include: {
        domainPack: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    return agent;
  }

  /**
   * Delete an agent
   */
  async delete(ctx: TenantContext, agentId: string) {
    const existing = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.agent.delete({
      where: { id: agentId },
    });

    return true;
  }

  /**
   * Start an agent (set status to RUNNING)
   */
  async start(ctx: TenantContext, agentId: string) {
    const existing = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    if (existing.status === 'RUNNING') {
      return existing; // Already running
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'RUNNING' },
    });

    return agent;
  }

  /**
   * Stop an agent (set status to IDLE)
   */
  async stop(ctx: TenantContext, agentId: string) {
    const existing = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'IDLE' },
    });

    return agent;
  }

  /**
   * Pause an agent
   */
  async pause(ctx: TenantContext, agentId: string) {
    const existing = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'PAUSED' },
    });

    return agent;
  }

  /**
   * Update agent metrics (called after run completion)
   */
  async updateMetrics(agentId: string) {
    // Calculate metrics from runs
    const stats = await prisma.agentRun.aggregate({
      where: { agentId },
      _count: { id: true },
      _avg: {
        // Can't directly avg JSON fields, so we'll do it differently
      },
    });

    const completedRuns = await prisma.agentRun.count({
      where: {
        agentId,
        status: 'COMPLETED',
      },
    });

    const lastRun = await prisma.agentRun.findFirst({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });

    const totalRuns = stats._count.id;
    const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

    // Get average execution time from completed runs
    const runsWithMetrics = await prisma.agentRun.findMany({
      where: {
        agentId,
        status: 'COMPLETED',
      },
      select: { metrics: true },
      take: 100,
    });

    let totalDuration = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const run of runsWithMetrics) {
      const metrics = run.metrics as { duration?: number; tokensUsed?: number; cost?: number };
      if (metrics.duration) totalDuration += metrics.duration;
      if (metrics.tokensUsed) totalTokens += metrics.tokensUsed;
      if (metrics.cost) totalCost += metrics.cost;
    }

    const avgExecutionTime = runsWithMetrics.length > 0
      ? totalDuration / runsWithMetrics.length
      : 0;

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          totalRuns,
          successRate: Math.round(successRate * 100) / 100,
          avgExecutionTime: Math.round(avgExecutionTime),
          lastRunAt: lastRun?.createdAt.toISOString() || null,
          tokensUsed: totalTokens,
          costTotal: Math.round(totalCost * 10000) / 10000,
        } as unknown as Prisma.JsonObject,
      },
    });
  }

  /**
   * Get agent count by status for dashboard
   */
  async getStatusCounts(ctx: TenantContext) {
    const counts = await prisma.agent.groupBy({
      by: ['status'],
      where: { tenantId: ctx.tenantId },
      _count: true,
    });

    const result: Record<AgentStatus, number> = {
      IDLE: 0,
      RUNNING: 0,
      PAUSED: 0,
      ERROR: 0,
      TERMINATED: 0,
      CONFIGURING: 0,
    };

    for (const item of counts) {
      result[item.status] = item._count;
    }

    return result;
  }
}

export const agentService = new AgentService();
