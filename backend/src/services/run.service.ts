// Run Service - Database operations for agent runs
// Handles execution tracking, steps, and metrics

import prisma from '../lib/prisma';
import { RunStatus, RunTrigger, StepType, Prisma } from '@prisma/client';
import { RunFiltersInput, CreateRunInput } from '../lib/validators';
import { TenantContext, RunMetrics } from '../types';
import { agentService } from './agent.service';

export class RunService {
  /**
   * List runs with filters and pagination
   */
  async list(ctx: TenantContext, filters: RunFiltersInput) {
    const { agentId, status, trigger, startDate, endDate, page, pageSize, sortBy, sortOrder } = filters;

    const where: Prisma.AgentRunWhereInput = {
      tenantId: ctx.tenantId,
      ...(agentId && { agentId }),
      ...(status && { status }),
      ...(trigger && { trigger }),
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [runs, total] = await Promise.all([
      prisma.agentRun.findMany({
        where,
        include: {
          agent: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { steps: true },
          },
        },
        orderBy: sortBy
          ? { [sortBy]: sortOrder }
          : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.agentRun.count({ where }),
    ]);

    return {
      data: runs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single run by ID
   */
  async getById(ctx: TenantContext, runId: string) {
    const run = await prisma.agentRun.findFirst({
      where: {
        id: runId,
        tenantId: ctx.tenantId,
      },
      include: {
        agent: {
          select: { id: true, name: true, avatar: true, configuration: true },
        },
        steps: {
          orderBy: { sequence: 'asc' },
        },
        subRuns: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            agent: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return run;
  }

  /**
   * Get execution steps for a run
   */
  async getSteps(ctx: TenantContext, runId: string) {
    // First verify the run belongs to the tenant
    const run = await prisma.agentRun.findFirst({
      where: {
        id: runId,
        tenantId: ctx.tenantId,
      },
    });

    if (!run) {
      return null;
    }

    const steps = await prisma.executionStep.findMany({
      where: { runId },
      orderBy: { sequence: 'asc' },
    });

    return steps;
  }

  /**
   * Create a new run
   */
  async create(ctx: TenantContext, data: CreateRunInput) {
    // Verify agent exists and belongs to tenant
    const agent = await prisma.agent.findFirst({
      where: {
        id: data.agentId,
        tenantId: ctx.tenantId,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const run = await prisma.agentRun.create({
      data: {
        agentId: data.agentId,
        tenantId: ctx.tenantId,
        trigger: data.trigger || 'MANUAL',
        status: 'PENDING',
        input: data.input as Prisma.JsonObject || {},
        metrics: {
          duration: null,
          tokensUsed: 0,
          toolCalls: 0,
          cost: 0,
          retries: 0,
        } as unknown as Prisma.JsonObject,
      },
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    return run;
  }

  /**
   * Start a run (transition to RUNNING)
   */
  async start(runId: string) {
    const run = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    return run;
  }

  /**
   * Complete a run (transition to COMPLETED)
   */
  async complete(runId: string, output: Record<string, unknown>, metrics: Partial<RunMetrics>) {
    const run = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        output: output as Prisma.JsonObject,
        metrics: metrics as unknown as Prisma.JsonObject,
      },
    });

    // Update agent metrics
    await agentService.updateMetrics(run.agentId);

    return run;
  }

  /**
   * Fail a run (transition to FAILED)
   */
  async fail(runId: string, error: { code: string; message: string; stack?: string }) {
    const run = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error as unknown as Prisma.JsonObject,
      },
    });

    // Update agent metrics
    await agentService.updateMetrics(run.agentId);

    return run;
  }

  /**
   * Cancel a run
   */
  async cancel(ctx: TenantContext, runId: string) {
    const existing = await prisma.agentRun.findFirst({
      where: {
        id: runId,
        tenantId: ctx.tenantId,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });

    if (!existing) {
      return null;
    }

    const run = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    return run;
  }

  /**
   * Add an execution step
   */
  async addStep(
    runId: string,
    type: StepType,
    content: string,
    options?: {
      toolId?: string;
      toolInput?: Record<string, unknown>;
      toolOutput?: Record<string, unknown>;
      duration?: number;
      metadata?: Record<string, unknown>;
    }
  ) {
    // Get current step count
    const stepCount = await prisma.executionStep.count({
      where: { runId },
    });

    const step = await prisma.executionStep.create({
      data: {
        runId,
        sequence: stepCount + 1,
        type,
        content,
        toolId: options?.toolId,
        toolInput: options?.toolInput as Prisma.JsonObject,
        toolOutput: options?.toolOutput as Prisma.JsonObject,
        duration: options?.duration,
        metadata: (options?.metadata || {}) as Prisma.JsonObject,
      },
    });

    return step;
  }

  /**
   * Get recent runs for dashboard
   */
  async getRecent(ctx: TenantContext, limit: number = 10) {
    const runs = await prisma.agentRun.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        agent: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return runs;
  }

  /**
   * Get run statistics for dashboard
   */
  async getStats(ctx: TenantContext, period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const [total, completed, failed] = await Promise.all([
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average execution time
    const completedRuns = await prisma.agentRun.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { metrics: true },
    });

    let totalDuration = 0;
    for (const run of completedRuns) {
      const metrics = run.metrics as { duration?: number };
      if (metrics.duration) totalDuration += metrics.duration;
    }

    const avgExecutionTime = completedRuns.length > 0
      ? totalDuration / completedRuns.length
      : 0;

    return {
      total,
      completed,
      failed,
      pending: total - completed - failed,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime: Math.round(avgExecutionTime),
    };
  }

  /**
   * Get runs today count (for dashboard)
   */
  async getTodayCount(ctx: TenantContext) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.agentRun.count({
      where: {
        tenantId: ctx.tenantId,
        createdAt: { gte: today },
      },
    });
  }
}

export const runService = new RunService();
