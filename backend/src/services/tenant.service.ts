// Tenant Service - Multi-tenant management and usage tracking

import prisma from '../lib/prisma';
import { TenantPlan, Prisma } from '@prisma/client';
import { CreateTenantInput, UpdateTenantInput } from '../lib/validators';
import { TenantContext, TenantLimits, TenantSettings, UsageStats } from '../types';

// Default limits by plan
const PLAN_LIMITS: Record<TenantPlan, TenantLimits> = {
  STARTER: {
    maxAgents: 3,
    maxUsers: 5,
    maxExecutionsPerMonth: 100,
    storageGB: 1,
  },
  PROFESSIONAL: {
    maxAgents: 25,
    maxUsers: 25,
    maxExecutionsPerMonth: 5000,
    storageGB: 10,
  },
  ENTERPRISE: {
    maxAgents: -1, // Unlimited
    maxUsers: -1,
    maxExecutionsPerMonth: -1,
    storageGB: 100,
  },
};

const DEFAULT_SETTINGS: TenantSettings = {
  theme: 'dark',
  timezone: 'UTC',
  language: 'en',
  notifications: {
    email: true,
    slack: false,
    inApp: true,
  },
};

export class TenantService {
  /**
   * Get tenant by ID
   */
  async getById(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            agents: true,
          },
        },
      },
    });
  }

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string) {
    return prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Create a new tenant
   */
  async create(data: CreateTenantInput) {
    const limits = PLAN_LIMITS[data.plan || 'STARTER'];
    const settings = { ...DEFAULT_SETTINGS, ...data.settings };

    return prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        plan: data.plan || 'STARTER',
        industry: data.industry,
        size: data.size,
        limits: limits as unknown as Prisma.JsonObject,
        settings: settings as unknown as Prisma.JsonObject,
      },
    });
  }

  /**
   * Update a tenant
   */
  async update(tenantId: string, data: UpdateTenantInput) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      return null;
    }

    const updateData: Prisma.TenantUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.plan && { plan: data.plan }),
    };

    // Update limits if plan changed
    if (data.plan) {
      updateData.limits = PLAN_LIMITS[data.plan] as unknown as Prisma.JsonObject;
    }

    // Merge settings if provided
    if (data.settings) {
      const currentSettings = existing.settings as unknown as TenantSettings;
      updateData.settings = {
        ...currentSettings,
        ...data.settings,
      } as unknown as Prisma.JsonObject;
    }

    return prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });
  }

  /**
   * Get usage statistics for a tenant
   */
  async getUsage(tenantId: string): Promise<UsageStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [agentsCount, usersCount, executionsThisMonth, tokenStats] = await Promise.all([
      prisma.agent.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.agentRun.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.agentRun.findMany({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
        select: { metrics: true },
      }),
    ]);

    // Calculate tokens used
    let tokensUsedThisMonth = 0;
    for (const run of tokenStats) {
      const metrics = run.metrics as { tokensUsed?: number };
      if (metrics.tokensUsed) tokensUsedThisMonth += metrics.tokensUsed;
    }

    // Storage calculation would be more complex in production
    // This is a placeholder
    const storageUsedGB = 0.5; // Placeholder

    return {
      agentsCount,
      usersCount,
      executionsThisMonth,
      tokensUsedThisMonth,
      storageUsedGB,
    };
  }

  /**
   * Check if tenant is within limits
   */
  async checkLimits(tenantId: string, resource: 'agents' | 'users' | 'executions') {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' };
    }

    const limits = tenant.limits as unknown as TenantLimits;
    const usage = await this.getUsage(tenantId);

    switch (resource) {
      case 'agents':
        if (limits.maxAgents === -1) return { allowed: true };
        if (usage.agentsCount >= limits.maxAgents) {
          return {
            allowed: false,
            reason: `Agent limit reached (${limits.maxAgents})`,
            current: usage.agentsCount,
            limit: limits.maxAgents,
          };
        }
        break;
      case 'users':
        if (limits.maxUsers === -1) return { allowed: true };
        if (usage.usersCount >= limits.maxUsers) {
          return {
            allowed: false,
            reason: `User limit reached (${limits.maxUsers})`,
            current: usage.usersCount,
            limit: limits.maxUsers,
          };
        }
        break;
      case 'executions':
        if (limits.maxExecutionsPerMonth === -1) return { allowed: true };
        if (usage.executionsThisMonth >= limits.maxExecutionsPerMonth) {
          return {
            allowed: false,
            reason: `Monthly execution limit reached (${limits.maxExecutionsPerMonth})`,
            current: usage.executionsThisMonth,
            limit: limits.maxExecutionsPerMonth,
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * List all tenants (admin only)
   */
  async list(page: number = 1, pageSize: number = 20) {
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          _count: {
            select: { users: true, agents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const tenantService = new TenantService();
