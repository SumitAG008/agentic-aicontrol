// Dashboard Service - Aggregated metrics and activity feed

import prisma from '../lib/prisma';
import { TenantContext, DashboardMetrics, ActivityItem } from '../types';

export class DashboardService {
  /**
   * Get dashboard metrics with trends
   */
  async getMetrics(ctx: TenantContext): Promise<DashboardMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const dayBefore = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000);

    // Get current stats
    const [
      activeAgents,
      runsToday,
      runsTodayCompleted,
      runsYesterday,
      runsYesterdayCompleted,
      previousActiveAgents,
    ] = await Promise.all([
      // Active agents (running or idle - not terminated/error)
      prisma.agent.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['IDLE', 'RUNNING', 'PAUSED'] },
        },
      }),
      // Runs today
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: { gte: today },
        },
      }),
      // Completed runs today
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'COMPLETED',
          createdAt: { gte: today },
        },
      }),
      // Runs yesterday
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      // Completed runs yesterday
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'COMPLETED',
          createdAt: { gte: yesterday, lt: today },
        },
      }),
      // Previous day agents count (for trend) - just use current as placeholder
      prisma.agent.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['IDLE', 'RUNNING', 'PAUSED'] },
          createdAt: { lt: today },
        },
      }),
    ]);

    // Calculate success rates
    const successRate = runsToday > 0
      ? (runsTodayCompleted / runsToday) * 100
      : 100;

    const yesterdaySuccessRate = runsYesterday > 0
      ? (runsYesterdayCompleted / runsYesterday) * 100
      : 100;

    // Get average execution time
    const completedRuns = await prisma.agentRun.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: today },
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

    // Calculate yesterday's avg execution time for trend
    const yesterdayRuns = await prisma.agentRun.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: yesterday, lt: today },
      },
      select: { metrics: true },
    });

    let yesterdayDuration = 0;
    for (const run of yesterdayRuns) {
      const metrics = run.metrics as { duration?: number };
      if (metrics.duration) yesterdayDuration += metrics.duration;
    }

    const yesterdayAvgTime = yesterdayRuns.length > 0
      ? yesterdayDuration / yesterdayRuns.length
      : avgExecutionTime;

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      activeAgents,
      runsToday,
      successRate: Math.round(successRate * 10) / 10,
      avgExecutionTime: Math.round(avgExecutionTime),
      activeAgentsTrend: calculateTrend(activeAgents, previousActiveAgents || activeAgents),
      runsTodayTrend: calculateTrend(runsToday, runsYesterday),
      successRateTrend: Math.round((successRate - yesterdaySuccessRate) * 10) / 10,
      avgExecutionTimeTrend: calculateTrend(avgExecutionTime, yesterdayAvgTime),
    };
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(ctx: TenantContext, limit: number = 20): Promise<ActivityItem[]> {
    // Get recent runs
    const recentRuns = await prisma.agentRun.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get recent agent creations
    const recentAgents = await prisma.agent.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get recent tool connections
    const recentToolConfigs = await prisma.tenantToolConfig.findMany({
      where: {
        tenantId: ctx.tenantId,
        isConnected: true,
      },
      include: {
        tool: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Build activity feed
    const activities: ActivityItem[] = [];

    // Add run activities
    for (const run of recentRuns) {
      let type: ActivityItem['type'];
      let message: string;

      switch (run.status) {
        case 'RUNNING':
          type = 'run_started';
          message = `${run.agent.name} started execution`;
          break;
        case 'COMPLETED':
          type = 'run_completed';
          message = `${run.agent.name} completed successfully`;
          break;
        case 'FAILED':
          type = 'run_failed';
          message = `${run.agent.name} execution failed`;
          break;
        default:
          continue;
      }

      activities.push({
        id: run.id,
        type,
        message,
        timestamp: run.createdAt,
        agentId: run.agent.id,
        agentName: run.agent.name,
      });
    }

    // Add agent creation activities
    for (const agent of recentAgents) {
      activities.push({
        id: `agent-${agent.id}`,
        type: 'agent_created',
        message: `New agent "${agent.name}" created`,
        timestamp: agent.createdAt,
        agentId: agent.id,
        agentName: agent.name,
      });
    }

    // Add tool connection activities
    for (const config of recentToolConfigs) {
      activities.push({
        id: `tool-${config.id}`,
        type: 'tool_connected',
        message: `${config.tool.name} connected`,
        timestamp: config.updatedAt,
      });
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit);
  }

  /**
   * Get agent status summary for grid
   */
  async getAgentStatusGrid(ctx: TenantContext, limit: number = 12) {
    const agents = await prisma.agent.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { not: 'TERMINATED' },
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        status: true,
        metrics: true,
        domainPack: {
          select: { name: true, slug: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // Running first
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    return agents;
  }

  /**
   * Get quick stats (for header/sidebar)
   */
  async getQuickStats(ctx: TenantContext) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [runningAgents, pendingRuns, errorCount] = await Promise.all([
      prisma.agent.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'RUNNING',
        },
      }),
      prisma.agentRun.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['PENDING', 'RUNNING'] },
        },
      }),
      prisma.agent.count({
        where: {
          tenantId: ctx.tenantId,
          status: 'ERROR',
        },
      }),
    ]);

    return {
      runningAgents,
      pendingRuns,
      errorCount,
    };
  }
}

export const dashboardService = new DashboardService();
